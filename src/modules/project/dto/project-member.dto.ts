import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import _ from 'lodash';

import { ProjectMemberRoleType } from '../../../common/constants/project-member-role.type';
import {
  AbstractDto,
  hideAbstractDtoAllProperties,
} from '../../../common/dto/abstract.dto';
import { UserDto } from '../../user/dto/user.dto';
import type { ProjectMemberEntity } from '../entities/project-member.entity';
import { ProjectMemberPositionDto } from './project-member-position.dto';

export class ProjectMemberDto extends AbstractDto {
  @ApiProperty({ type: [ProjectMemberPositionDto] })
  readonly positions: ProjectMemberPositionDto[];

  @ApiProperty({ type: () => UserDto })
  readonly user: UserDto;

  @ApiProperty({ enum: ProjectMemberRoleType })
  @IsEnum(ProjectMemberRoleType)
  readonly role: ProjectMemberRoleType;

  constructor(entity: ProjectMemberEntity) {
    super(entity, hideAbstractDtoAllProperties);
    this.positions = entity.positions.map((pos) => pos.toDto());
    this.user = entity.user.toDto({ isPublic: true });
    this.role = entity.role;
  }
}
