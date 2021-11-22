import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { RoleType } from '../../../common/constants/role-type';
import { AbstractDto } from '../../../common/dto/abstract.dto';
import type { UserEntity } from '../user.entity';

export type UserDtoOptions = Partial<{ isActive: boolean; isPublic: boolean }>;

export class UserDto extends AbstractDto {
  @ApiProperty()
  username: string;

  @ApiPropertyOptional({ enum: RoleType })
  role: RoleType;

  @ApiPropertyOptional()
  email?: string;

  @ApiPropertyOptional()
  avatar?: string;

  @ApiPropertyOptional()
  isActive?: boolean;

  constructor(user: UserEntity, options?: UserDtoOptions) {
    super(user);
    this.username = user.username;
    this.role = user.role;
    this.email = options?.isPublic ? undefined : user.email;
    this.avatar = user.avatar ? user.avatar : undefined;
    this.isActive = options?.isActive || (user.deleted ? false : undefined);
  }
}
