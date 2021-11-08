import './boilerplate.polyfill';

import type { MiddlewareConsumer, NestModule } from '@nestjs/common';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SharedIniFileCredentials, SQS } from 'aws-sdk';
import { AwsSdkModule } from 'nest-aws-sdk';
import { I18nJsonParser, I18nModule } from 'nestjs-i18n';
import { LoggerModule } from 'nestjs-pino';
import path from 'path';

import { contextMiddleware } from './middlewares';
import { AuthModule } from './modules/auth/auth.module';
import { HealthCheckerModule } from './modules/health-checker/health-checker.module';
import { PostModule } from './modules/post/post.module';
import { UserModule } from './modules/user/user.module';
import { ApiConfigService } from './shared/services/api-config.service';
import { SharedModule } from './shared/shared.module';

@Module({
  imports: [
    AuthModule,
    UserModule,
    PostModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'test' ? '.env.test' : '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [SharedModule],
      useFactory: (configService: ApiConfigService) =>
        configService.typeOrmConfig,
      inject: [ApiConfigService],
    }),
    I18nModule.forRootAsync({
      useFactory: (configService: ApiConfigService) => ({
        fallbackLanguage: configService.fallbackLanguage,
        parserOptions: {
          path: path.join(__dirname, '/i18n/'),
          watch: configService.isDevelopment,
        },
      }),
      imports: [SharedModule],
      parser: I18nJsonParser,
      inject: [ApiConfigService],
    }),
    AwsSdkModule.forRoot({
      defaultServiceOptions: {
        region: 'ap-northeast-2',
        credentials:
          process.env.NODE_ENV === 'local'
            ? new SharedIniFileCredentials({
                profile: 'sideteam-serverless-local',
              })
            : undefined,
      },
      services: [SQS],
    }),
    HealthCheckerModule,
    LoggerModule.forRoot({
      pinoHttp: [
        {
          level: process.env.NODE_ENV !== 'production' ? 'debug' : 'info',
          prettyPrint: process.env.NODE_ENV !== 'production',
          useLevelLabels: true,
        },
      ],
    }),
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): MiddlewareConsumer | void {
    consumer.apply(contextMiddleware).forRoutes('*');
  }
}
