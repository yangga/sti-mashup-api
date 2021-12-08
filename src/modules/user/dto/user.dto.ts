import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator';

import { RoleType } from '../../../common/constants/role.type';
import { AbstractDto } from '../../../common/dto/abstract.dto';
import type { UserEntity } from '../entities/user.entity';

export type UserDtoOptions = Partial<{ isActive: boolean; isPublic: boolean }>;

export class UserDto extends AbstractDto {
  @ApiProperty()
  username: string;

  @ApiPropertyOptional({ enum: RoleType })
  @IsEnum(RoleType)
  role: RoleType;

  @ApiPropertyOptional()
  email?: string;

  @ApiPropertyOptional()
  avatar?: string;

  @ApiProperty()
  level: number;

  @ApiPropertyOptional({ type: [String] })
  @IsNotEmpty()
  @IsOptional()
  readonly languages?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsNotEmpty()
  @IsOptional()
  readonly positions?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsNotEmpty()
  @IsOptional()
  readonly interesting?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsNotEmpty()
  @IsOptional()
  readonly skills?: string[];

  @ApiPropertyOptional()
  isActive?: boolean;

  constructor(user: UserEntity, options?: UserDtoOptions) {
    super(user);
    this.username = user.username;
    this.role = user.role;
    this.email = options?.isPublic ? undefined : user.email;
    this.avatar = user.avatar ? user.avatar : undefined;
    this.level = user.level;
    this.languages = user.languages;
    this.positions = user.positions;
    this.interesting = user.interesting;
    this.skills = user.skills;
    this.isActive = options?.isActive || (user.deleted ? false : undefined);
  }
}
