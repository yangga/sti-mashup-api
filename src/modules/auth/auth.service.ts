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
  ActionType,
  SourceType,
  VerificationTokenService,
} from '../../shared/services/verification-token.service';
import type { UserDto } from '../user/dto/user-dto';
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

  async emailVerification(toAddress: string, locale: string): Promise<void> {
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
      ActionType.SIGNUP,
      SourceType.EMAIL,
      toAddress,
      ttl,
      toAddress,
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

  async getEmailVerification({ code }: { code: string }): Promise<{
    code: string;
    email: string;
  }> {
    const res = await this.tokenService.getToken(code);

    if (!res) {
      throw new TokenNotFoundException();
    }

    if (res.action !== ActionType.SIGNUP) {
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
