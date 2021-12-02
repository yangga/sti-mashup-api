import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { TokenType } from '../../common/constants/token-type';
import { EmailAlreadyUsedException } from '../../exceptions/email-already-used.exception';
import { UserNotFoundException } from '../../exceptions/user-not-found.exception';
import { UtilsProvider } from '../../providers/utils.provider';
import type { VerificationTokenDto } from '../../shared/dto/verification-token.dto';
import { ApiConfigService } from '../../shared/services/api-config.service';
import type { IEmailPayload } from '../../shared/services/email.service';
import { EmailService } from '../../shared/services/email.service';
import {
  SourceType,
  VerificationTokenService,
} from '../../shared/services/verification-token.service';
import type { UserDto } from '../user/dto/user.dto';
import type { UserEntity } from '../user/user.entity';
import { UserService } from '../user/user.service';
import { TokenNotFoundException } from './../../exceptions/token-not-found.exception';
import { TokenPayloadDto } from './dto/token-payload.dto';
import type { UserLoginDto } from './dto/user-login.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ApiConfigService,
    private readonly userService: UserService,
    private readonly emailService: EmailService,
    private readonly tokenService: VerificationTokenService,
  ) {}

  async emailResetPasswordVerification(
    toAddress: string,
    locale: string,
  ): Promise<void> {
    const oldUser = await this.userService.findOne({
      email: toAddress,
    });

    if (!oldUser || oldUser.deleted) {
      throw new UserNotFoundException();
    }

    const ttl =
      Math.floor(Date.now() * 0.001) +
      (this.configService.emailVerificationTimeoutMin + 1) * 60;

    const code = await this.tokenService.createToken(
      TokenType.RESET_PASSWORD,
      SourceType.EMAIL,
      toAddress,
      ttl,
      toAddress,
    );

    const params = new URLSearchParams();
    params.append('code', code);
    params.append('source', SourceType.EMAIL);

    const actionUrl = `${
      this.configService.webPageUrl
    }/resetpwd-verified?${params.toString()}`;

    const template = `verify-email-resetpwd_${locale}_${this.configService.stage}`;

    return this.emailVerification({
      toAddress,
      actionUrl,
      template,
    });
  }

  async emailSignupVerification(
    toAddress: string,
    locale: string,
  ): Promise<void> {
    const oldUser = await this.userService.findOne({
      email: toAddress,
    });

    if (oldUser && !oldUser.deleted) {
      throw new EmailAlreadyUsedException();
    }

    const ttl =
      Math.floor(Date.now() * 0.001) +
      (this.configService.emailVerificationTimeoutMin + 1) * 60;

    const code = await this.tokenService.createToken(
      TokenType.SIGNUP,
      SourceType.EMAIL,
      toAddress,
      ttl,
      toAddress,
    );

    const params = new URLSearchParams();
    params.append('code', code);
    params.append('source', SourceType.EMAIL);

    const actionUrl = `${
      this.configService.webPageUrl
    }/join-verified?${params.toString()}`;

    const template = `verify-email-join_${locale}_${this.configService.stage}`;

    return this.emailVerification({
      toAddress,
      actionUrl,
      template,
    });
  }

  private async emailVerification({
    toAddress,
    actionUrl,
    template,
  }: {
    toAddress: string;
    actionUrl: string;
    template: string;
  }): Promise<void> {
    const source = this.configService.emailAddrNoreply;

    const emailParam: IEmailPayload = {
      destination: {
        to: [toAddress],
      },
      source,
      template,
      templateData: {
        action_url: actionUrl,
      },
    };

    await this.emailService.email(emailParam);

    this.logger.debug('email', JSON.stringify(emailParam));
  }

  async extendEmailVerification({
    code,
    ttl,
  }: {
    code: string;
    ttl: number;
  }): Promise<VerificationTokenDto> {
    return this.tokenService.extendToken(code, ttl);
  }

  async getResetpwdEmailVerification({ code }: { code: string }): Promise<{
    code: string;
    email: string;
  }> {
    return this.getEmailVerification({
      code,
      action: TokenType.RESET_PASSWORD,
    });
  }

  async getSignupEmailVerification({ code }: { code: string }): Promise<{
    code: string;
    email: string;
  }> {
    return this.getEmailVerification({ code, action: TokenType.SIGNUP });
  }

  private async getEmailVerification({
    code,
    action,
  }: {
    code: string;
    action: TokenType;
  }): Promise<{
    code: string;
    email: string;
  }> {
    const res = await this.tokenService.getToken(code);

    if (!res) {
      throw new TokenNotFoundException();
    }

    if (res.action !== action) {
      throw new InternalServerErrorException();
    }

    const email: string = res.data as string;

    return {
      code,
      email,
    };
  }

  async expireEmailVerification({ code }: { code: string }): Promise<void> {
    await this.tokenService.terminateToken(code);
  }

  async createToken(user: UserEntity | UserDto): Promise<TokenPayloadDto> {
    return new TokenPayloadDto({
      expiresIn: this.configService.authConfig.jwtExpirationTime,
      accessToken: await this.jwtService.signAsync({
        userId: user.id,
        type: TokenType.ACCESS_TOKEN,
        role: user.role,
      }),
    });
  }

  async validateUser(userLoginDto: UserLoginDto): Promise<UserEntity> {
    const user = await this.userService.findOne({
      email: userLoginDto.email,
    });
    const isPasswordValid = await UtilsProvider.validateHash(
      userLoginDto.password,
      user?.password,
    );

    if (!user || !isPasswordValid) {
      throw new UserNotFoundException();
    }

    return user;
  }
}
