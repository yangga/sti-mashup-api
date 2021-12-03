import {
  Body,
  Controller,
  Delete,
  HttpStatus,
  Logger,
  Post,
  Put,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { RoleType } from '../../common/constants/role.type';
import { CommonHeaderDto } from '../../common/dto/common-header.dto';
import { AuthUser } from '../../decorators/auth-user.decorator';
import { CommonHeader } from '../../decorators/common-header.decorator';
import { Auth } from '../../decorators/http.decorators';
import { RequestHeader } from '../../decorators/request-header.decorator';
import {
  ResponseData,
  ResponseError,
} from '../../decorators/response-data.decorators';
import { TokenNotFoundException } from '../../exceptions/token-not-found.exception';
import { UserBlockedException } from '../../exceptions/user-blocked.exception';
import { UserNotFoundException } from '../../exceptions/user-not-found.exception';
import { VerificationTokenDto } from '../../shared/dto/verification-token.dto';
import { UserDto } from '../user/dto/user.dto';
import { UserEntity } from '../user/entities/user.entity';
import { UserService } from '../user/user.service';
import { AuthService } from './auth.service';
import { LoginPayloadDto } from './dto/login-payload.dto';
import { UserForgotPasswordDto } from './dto/user-forgotpassword.dto';
import { UserLoginDto } from './dto/user-login.dto';
import { UserQuitDto } from './dto/user-quit.dto';
import { UserRegisterDto } from './dto/user-register.dto';
import { UserResetPasswordDto } from './dto/user-resetpassword.dto';
import {
  VerifyEmailConfirmDto,
  VerifyEmailReqDto,
} from './dto/verification.dto';

@CommonHeader()
@Controller({
  path: 'auth',
  version: '1',
})
@ApiTags('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) {}

  @Post('verify/email')
  @ApiOperation({
    summary: '',
    description: '인증 메일 요청',
  })
  @ResponseData()
  async reqEmailVerification(
    @RequestHeader(CommonHeaderDto) header: CommonHeaderDto,
    @Body() body: VerifyEmailReqDto,
  ): Promise<void> {
    await this.authService.emailSignupVerification(body.email, header.locale);
  }

  @Post('verify/email/confirm')
  @ApiOperation({
    summary: '',
    description: '인증 메일 확인',
  })
  @ResponseData(VerificationTokenDto)
  @ResponseError(HttpStatus.NOT_FOUND)
  async confirmEmailVerification(
    @Body() body: VerifyEmailConfirmDto,
  ): Promise<VerificationTokenDto> {
    return this.authService.extendEmailVerification({
      code: body.code,
      ttl: Math.floor(Date.now() * 0.001 + 30 * 1000),
    });
  }

  @Post('register')
  @ApiOperation({
    summary: '',
    description: '가입',
  })
  @ResponseData(UserDto)
  async userRegister(@Body() body: UserRegisterDto): Promise<UserDto> {
    const { verificationCode } = body;

    const verfication = await this.authService.getSignupEmailVerification({
      code: verificationCode,
    });

    if (!verfication) {
      throw new TokenNotFoundException();
    }

    const createdUser = await this.userService.createUser(body, {
      email: verfication.email,
    });

    try {
      await this.authService.expireEmailVerification({
        code: verificationCode,
      });
    } catch (error) {
      this.logger.log(error);
    }

    return createdUser.toDto({
      isActive: true,
    });
  }

  @Post('login')
  @ApiOperation({
    summary: '',
    description: 'User info with access token',
  })
  @ResponseData(LoginPayloadDto)
  async userLogin(@Body() body: UserLoginDto): Promise<LoginPayloadDto> {
    const userEntity = await this.authService.validateUser(body);

    if (
      userEntity.blockUntilAt &&
      userEntity.blockUntilAt.getTime() > Date.now()
    ) {
      throw new UserBlockedException();
    }

    if (userEntity.deleted) {
      throw new UserNotFoundException();
    }

    const token = await this.authService.createToken(userEntity);

    return new LoginPayloadDto(userEntity.toDto(), token);
  }

  @Post('reset-password')
  @ApiOperation({
    summary: '',
    description: '비밀번호 변경 요청',
  })
  @ResponseData()
  async userRequestResetPassword(
    @RequestHeader(CommonHeaderDto) header: CommonHeaderDto,
    @Body() body: UserForgotPasswordDto,
  ): Promise<void> {
    await this.authService.emailResetPasswordVerification(
      body.email,
      header.locale,
    );
  }

  @Put('reset-password')
  @ApiOperation({
    summary: '',
    description: '비밀번호 변경',
  })
  @ResponseData(UserDto)
  async userResetPassword(
    @Body() body: UserResetPasswordDto,
  ): Promise<UserDto> {
    const { email, password, verificationCode } = body;

    const verfication = await this.authService.getResetpwdEmailVerification({
      code: verificationCode,
    });

    if (!verfication) {
      throw new TokenNotFoundException();
    }

    const user = await this.userService.changePassword(email, password);

    try {
      await this.authService.expireEmailVerification({
        code: verificationCode,
      });
    } catch (error) {
      this.logger.log(error);
    }

    return user.toDto({
      isActive: true,
    });
  }

  @Delete('quit')
  @ApiOperation({
    summary: '',
    description: '탈퇴',
  })
  @Auth([RoleType.USER])
  @ResponseData()
  async userQuit(
    @AuthUser() user: UserEntity,
    @Body() userLoginDto: UserQuitDto,
  ): Promise<void> {
    await this.userService.withdrawUser(user.id, userLoginDto);
  }
}
