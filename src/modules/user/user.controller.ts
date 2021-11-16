import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UploadedFile,
  ValidationPipe,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { RoleType } from '../../common/constants/role-type';
import { PageDto } from '../../common/dto/page.dto';
import { AuthUser } from '../../decorators/auth-user.decorator';
import { CommonHeader } from '../../decorators/common-header.decorator';
import { Auth } from '../../decorators/http.decorators';
import { ResponseData } from '../../decorators/response-data.decorators';
import { ApiFile } from '../../decorators/swagger.schema';
import { IFile } from '../../interfaces';
import { TranslationService } from '../../shared/services/translation.service';
import { UserDto } from './dto/user-dto';
import { UserPicDto } from './dto/UserPicDto';
import { UsersPageOptionsDto } from './dto/users-page-options.dto';
import { UserEntity } from './user.entity';
import { UserService } from './user.service';

@CommonHeader()
@Controller({ path: 'users', version: '1' })
@ApiTags('users')
export class UserController {
  constructor(
    private userService: UserService,
    private readonly translationService: TranslationService,
  ) {}

  @Get('admin')
  @Auth([RoleType.USER])
  @HttpCode(HttpStatus.OK)
  async admin(@AuthUser() user: UserEntity): Promise<string> {
    const translation = await this.translationService.translate(
      'keywords.admin',
      {
        lang: 'en',
      },
    );

    return `${translation} ${user.username}`;
  }

  @Get()
  @ApiOperation({
    summary: '',
    description: 'Get users list',
  })
  @Auth([RoleType.USER])
  @ResponseData(PageDto)
  getUsers(
    @Query(new ValidationPipe({ transform: true }))
    pageOptionsDto: UsersPageOptionsDto,
  ): Promise<PageDto<UserDto>> {
    return this.userService.getUsers(pageOptionsDto);
  }

  @Get(':id')
  @ApiOperation({
    summary: '',
    description: 'Get users list',
  })
  @Auth([RoleType.USER])
  @ResponseData(UserDto)
  getUser(@Query('id') id: number): Promise<UserDto> {
    return this.userService.getUser(id);
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  @Post('pic')
  @ResponseData(UserPicDto)
  @Auth([RoleType.USER])
  @ApiFile({ name: 'avatar' }, { isRequired: true })
  // eslint-disable-next-line @typescript-eslint/no-unused-vars-experimental
  async userRegister(
    @AuthUser() user: UserEntity,
    @UploadedFile() file: IFile,
  ): Promise<UserPicDto> {
    return this.userService.uploadUserPic(user.id, file);
  }
}
