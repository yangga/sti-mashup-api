/* eslint-disable max-classes-per-file */
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber } from 'class-validator';

import { ProjectMemberRoleType } from '../../../common/constants/project-member-role.type';

export class ProjectMemberRoleDto {
  @ApiProperty()
  @IsNumber()
  readonly userId: number;

  @ApiProperty({ enum: ProjectMemberRoleType })
  @IsEnum(ProjectMemberRoleType)
  readonly role: ProjectMemberRoleType;

  constructor(userId: number, role: ProjectMemberRoleType) {
    this.userId = userId;
    this.role = role;
  }
}
