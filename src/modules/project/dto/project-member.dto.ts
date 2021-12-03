import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import _ from 'lodash';

import { ProjectMemberRoleType } from '../../../common/constants/project-member-role.type';
import { AbstractDto } from '../../../common/dto/abstract.dto';
import { UserDto } from '../../user/dto/user.dto';
import type { ProjectMemberEntity } from '../entities/project-member.entity';

export class ProjectMemberDto extends AbstractDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly position: string;

  @ApiProperty({ type: () => UserDto })
  readonly user: UserDto;

  @ApiProperty({ enum: ProjectMemberRoleType })
  readonly role: ProjectMemberRoleType;

  constructor(entity: ProjectMemberEntity) {
    super(entity);
    this.position = entity.position;
    this.user = entity.user.toDto();
    this.role = entity.role;
  }
}
