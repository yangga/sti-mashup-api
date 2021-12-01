import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MyController } from './my.controller';
import { UserRepository } from './repositories/user.repository';
import { UserSettingsRepository } from './repositories/user-settings.repository';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserRepository, UserSettingsRepository])],
  controllers: [MyController, UserController],
  exports: [UserService],
  providers: [UserService],
})
export class UserModule {}
