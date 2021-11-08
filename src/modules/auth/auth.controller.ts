import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Version,
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
import { ResponseData } from '../../decorators/response-data.decorators';
import { ApiFile } from '../../decorators/swagger.schema';
import { AuthGuard } from '../../guards/auth.guard';
import { AuthUserInterceptor } from '../../interceptors/auth-user-interceptor.service';
import { IFile } from '../../interfaces';
import { UserDto } from '../user/dto/user-dto';
import { UserEntity } from '../user/user.entity';
import { UserService } from '../user/user.service';
import { AuthService } from './auth.service';
import { LoginPayloadDto } from './dto/LoginPayloadDto';
import { UserLoginDto } from './dto/UserLoginDto';
import { UserRegisterDto } from './dto/UserRegisterDto';
import { UserSignupDto } from './dto/UserSignupDto';

@CommonHeader()
@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) {}

  @Post('verify-email')
  @ApiOperation({
    summary: '',
    description: '{vendorId}에 해당하는 업장정보로 제한 됨',
  })
  @ResponseData()
  async reqEmailVerification(
    @RequestHeader(CommonHeaderDto) header: CommonHeaderDto,
    @Body() userSignupDto: UserSignupDto,
  ): Promise<void> {
    await this.authService.emailVerification(
      'signup',
      userSignupDto.email,
      header.locale,
    );
  }

  @Post('verify-email/confirm')
  @ResponseData()
  async confirmEmailVerification(@Param('code') code: string): Promise<void> {
    await this.authService.extendEmailVerification({
      code,
      ttl: Math.floor(Date.now() * 0.001 + 30 * 1000),
    });
  }

  @Post('register')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: UserDto, description: 'Successfully Registered' })
  @ApiFile({ name: 'avatar' })
  async userRegister(
    @Body() userRegisterDto: UserRegisterDto,
    @UploadedFile() file: IFile,
  ): Promise<UserDto> {
    const createdUser = await this.userService.createUser(
      userRegisterDto,
      file,
    );

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

  @Version('1')
  @Get('me')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @UseInterceptors(AuthUserInterceptor)
  @ApiBearerAuth()
  @ApiOkResponse({ type: UserDto, description: 'current user info' })
  getCurrentUser(@AuthUser() user: UserEntity): UserDto {
    return user.toDto();
  }
}
