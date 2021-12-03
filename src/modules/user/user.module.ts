import { Module } from '@nestjs/common';

import { MyController } from './my.controller';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  controllers: [MyController, UserController],
  exports: [UserService],
  providers: [UserService],
})
export class UserModule {}
