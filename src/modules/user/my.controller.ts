import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Put,
  UploadedFile,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { RoleType } from '../../common/constants/role-type';
import { AuthUser } from '../../decorators/auth-user.decorator';
import { CommonHeader } from '../../decorators/common-header.decorator';
import { Auth } from '../../decorators/http.decorators';
import { ResponseData } from '../../decorators/response-data.decorators';
import { ApiFile } from '../../decorators/swagger.schema';
import { IFile } from '../../interfaces';
import { UserDto } from './dto/user.dto';
import { UserPicDto } from './dto/user-pic.dto';
import { UserProfileRequestDto } from './dto/user-profile-request.dto';
import { UserSettingsDto } from './dto/user-settings.dto';
import { UserEntity } from './user.entity';
import { UserService } from './user.service';

@CommonHeader()
@Controller({ path: 'my', version: '1' })
@ApiTags('users')
export class MyController {
  constructor(private userService: UserService) {}

  @Get(['/', '/profile'])
  @Auth([RoleType.USER])
  @ResponseData(UserDto)
  getCurrentUser(@AuthUser() user: UserEntity): UserDto {
    return user.toDto();
  }

  @Patch('profile')
  @ResponseData(UserDto)
  @Auth([RoleType.USER])
  async updateUserProfile(
    @AuthUser() user: UserEntity,
    @Body() body: UserProfileRequestDto,
  ): Promise<UserPicDto> {
    return this.userService.updateUserProfile(user.id, body);
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  @Put('pic')
  @ResponseData(UserPicDto)
  @Auth([RoleType.USER])
  @ApiFile({ name: 'avatar' }, { isRequired: true })
  // eslint-disable-next-line @typescript-eslint/no-unused-vars-experimental
  async uploadUserPic(
    @AuthUser() user: UserEntity,
    @UploadedFile() file: IFile,
  ): Promise<UserPicDto> {
    return this.userService.uploadUserPic(user.id, file);
  }

  @Delete('pic')
  @ResponseData()
  @Auth([RoleType.USER])
  async deleteUserPic(@AuthUser() user: UserEntity): Promise<void> {
    await this.userService.delUserPic(user.id);
  }

  @Get('settings')
  @ResponseData(UserSettingsDto)
  @Auth([RoleType.USER])
  async getUserSettings(
    @AuthUser() user: UserEntity,
  ): Promise<UserSettingsDto> {
    const settings = await user.settings;

    if (!settings) {
      return {};
    }

    return settings.toDto();
  }

  @Patch('settings')
  @ResponseData(UserSettingsDto)
  @Auth([RoleType.USER])
  async updateUserSettings(
    @AuthUser() user: UserEntity,
    @Body() body: UserSettingsDto,
  ): Promise<UserSettingsDto> {
    return this.userService.updateUserSettings(user.id, body);
  }
}
