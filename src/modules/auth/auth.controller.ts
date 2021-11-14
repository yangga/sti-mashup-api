import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { CommonHeaderDto } from '../../common/dto/common-header.dto';
import { AuthUser } from '../../decorators/auth-user.decorator';
import { CommonHeader } from '../../decorators/common-header.decorator';
import { RequestHeader } from '../../decorators/request-header.decorator';
import {
  ResponseData,
  ResponseError,
} from '../../decorators/response-data.decorators';
import { TokenNotFoundException } from '../../exceptions/token-not-found.exception';
import { AuthGuard } from '../../guards/auth.guard';
import { AuthUserInterceptor } from '../../interceptors/auth-user-interceptor.service';
import { VerificationTokenDto } from '../../shared/dto/verification-token.dto';
import { UserDto } from '../user/dto/user-dto';
import { UserEntity } from '../user/user.entity';
import { UserService } from '../user/user.service';
import { AuthService } from './auth.service';
import { LoginPayloadDto } from './dto/LoginPayloadDto';
import { UserLoginDto } from './dto/UserLoginDto';
import { UserRegisterDto } from './dto/UserRegisterDto';
import {
  VerifyEmailConfirmDto,
  VerifyEmailReqDto,
} from './dto/VerificationDto';

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
    await this.authService.emailVerification(body.email, header.locale);
  }

  @Post('verify/email/confirm')
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
  @HttpCode(HttpStatus.OK)
  @ResponseData(UserDto)
  async userRegister(
    @Body() userRegisterDto: UserRegisterDto,
  ): Promise<UserDto> {
    const { registerCode } = userRegisterDto;

    const verfication = await this.authService.getEmailVerification({
      code: registerCode,
    });

    if (!verfication) {
      throw new TokenNotFoundException();
    }

    const createdUser = await this.userService.createUser(userRegisterDto, {
      email: verfication.email,
    });

    try {
      await this.authService.expireEmailVerification({ code: registerCode });
    } catch (error) {
      this.logger.log(error);
    }

    return createdUser.toDto({
      isActive: true,
    });
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: LoginPayloadDto,
    description: 'User info with access token',
  })
  async userLogin(
    @Body() userLoginDto: UserLoginDto,
  ): Promise<LoginPayloadDto> {
    const userEntity = await this.authService.validateUser(userLoginDto);

    const token = await this.authService.createToken(userEntity);

    return new LoginPayloadDto(userEntity.toDto(), token);
  }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @UseInterceptors(AuthUserInterceptor)
  @ApiBearerAuth()
  @ResponseData(UserDto)
  getCurrentUser(@AuthUser() user: UserEntity): UserDto {
    return user.toDto();
  }
}
