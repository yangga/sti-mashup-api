import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { UserNotFoundException } from '../../exceptions/user-not-found.exception';
import { UtilsProvider } from '../../providers/utils.provider';
import type { VerificationTokenDto } from '../../shared/dto/verification-token.dto';
import { ApiConfigService } from '../../shared/services/api-config.service';
import type { IEmailPayload } from '../../shared/services/email.service';
import { EmailService } from '../../shared/services/email.service';
import { VerificationTokenService } from '../../shared/services/verification-token.service';
import type { UserDto } from '../user/dto/user-dto';
import type { UserEntity } from '../user/user.entity';
import { UserService } from '../user/user.service';
import { TokenPayloadDto } from './dto/TokenPayloadDto';
import type { UserLoginDto } from './dto/UserLoginDto';

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

  async emailVerification(
    action: string,
    toAddress: string,
    locale: string,
  ): Promise<void> {
    const ttl =
      Math.floor(Date.now() * 0.001) +
      (this.configService.emailVerificationTimeoutMin + 1) * 60;

    const code = await this.tokenService.createToken(
      action,
      'email',
      toAddress,
      ttl,
    );

    const params = new URLSearchParams();
    params.append('code', code);

    const actionUrl = `${
      this.configService.webPageUrl
    }/verify-email?${params.toString()}`;

    const source = this.configService.emailAddrNoreply;
    const template = `verify-email_${locale}_${this.configService.stage}`;

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

  async createToken(user: UserEntity | UserDto): Promise<TokenPayloadDto> {
    return new TokenPayloadDto({
      expiresIn: this.configService.authConfig.jwtExpirationTime,
      accessToken: await this.jwtService.signAsync({ id: user.id }),
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
