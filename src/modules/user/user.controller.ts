import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { RoleType } from '../../common/constants/role.type';
import { PageDto } from '../../common/dto/page.dto';
import { AuthUser } from '../../decorators/auth-user.decorator';
import { CommonHeader } from '../../decorators/common-header.decorator';
import { Auth } from '../../decorators/http.decorators';
import { ResponseData } from '../../decorators/response-data.decorators';
import { TranslationService } from '../../shared/services/translation.service';
import { UserDto } from './dto/user.dto';
import { UsersPageOptionsDto } from './dto/users-page-options.dto';
import { UserEntity } from './entities/user.entity';
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
  @Auth([RoleType.ADMIN])
  @ResponseData(PageDto)
  getUsers(
    @Query(new ValidationPipe({ transform: true }))
    pageOptionsDto: UsersPageOptionsDto,
  ): Promise<PageDto<UserDto>> {
    return this.userService.getUsers(pageOptionsDto, {
      isPublic: true,
    });
  }

  @Get(':id')
  @ApiOperation({
    summary: '',
    description: 'Get an user',
  })
  @Auth([RoleType.USER])
  @ResponseData(UserDto)
  getUser(@Query('id') id: number): Promise<UserDto> {
    return this.userService.getUser(id, {
      isPublic: true,
    });
  }
}
