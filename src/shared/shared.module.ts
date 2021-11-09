import { HttpModule } from '@nestjs/axios';
import { Global, Module } from '@nestjs/common';

// import { ClientProxyFactory, Transport } from '@nestjs/microservices';
import { ApiConfigService } from './services/api-config.service';
import { AwsS3Service } from './services/aws-s3.service';
import { EmailService } from './services/email.service';
import { GeneratorService } from './services/generator.service';
import { TranslationService } from './services/translation.service';
import { ValidatorService } from './services/validator.service';
import { VerificationTokenService } from './services/verification-token.service';

const providers = [
  ApiConfigService,
  ValidatorService,
  AwsS3Service,
  GeneratorService,
  TranslationService,
  EmailService,
  VerificationTokenService,
  // {
  //   provide: 'NATS_SERVICE',
  //   useFactory: (configService: ApiConfigService) => {
  //     const natsConfig = configService.natsConfig;
  //     return ClientProxyFactory.create({
  //       transport: Transport.NATS,
  //       options: {
  //         name: 'NATS_SERVICE',
  //         url: `nats://${natsConfig.host}:${natsConfig.port}`,
  //       },
  //     });
  //   },
  //   inject: [ApiConfigService],
  // },
];

@Global()
@Module({
  providers,
  imports: [HttpModule],
  exports: [...providers, HttpModule],
})
export class SharedModule {}
