import './boilerplate.polyfill';

import type { MiddlewareConsumer, NestModule } from '@nestjs/common';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GraphqlInterceptor, SentryModule } from '@ntegral/nestjs-sentry';
import { LogLevel } from '@sentry/types';
import { SharedIniFileCredentials, SQS } from 'aws-sdk';
import { AwsSdkModule } from 'nest-aws-sdk';
import { I18nJsonParser, I18nModule } from 'nestjs-i18n';
import { LoggerModule } from 'nestjs-pino';
import path from 'path';

import { contextMiddleware } from './middlewares';
import { AuthModule } from './modules/auth/auth.module';
import { HealthCheckerModule } from './modules/health-checker/health-checker.module';
import { MetaModule } from './modules/meta/meta.module';
import { PostModule } from './modules/post/post.module';
import { ProjectModule } from './modules/project/project.module';
import { SearchModule } from './modules/search/search.module';
import { UserModule } from './modules/user/user.module';
import { ApiConfigService } from './shared/services/api-config.service';
import { SharedModule } from './shared/shared.module';

const STAGE = process.env.STAGE;

@Module({
  imports: [
    SentryModule.forRoot({
      dsn: 'https://37e66ebf907b48a0a424cb1131c87e5a@o1064933.ingest.sentry.io/6056082',
      debug: STAGE === 'dev',
      environment: STAGE,
      logLevel: LogLevel.Debug,
      close: {
        enabled: true,
        timeout: 1500,
      },
    }),
    AuthModule,
    UserModule,
    PostModule,
    ProjectModule,
    SearchModule,
    MetaModule,
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
    ScheduleModule.forRoot(),
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useFactory: () => new GraphqlInterceptor(),
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): MiddlewareConsumer | void {
    consumer.apply(contextMiddleware).forRoutes('*');
  }
}
