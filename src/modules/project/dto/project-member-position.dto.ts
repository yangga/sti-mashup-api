import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

import { AbstractDto } from '../../../common/dto/abstract.dto';
import type { ProjectMemberPositionEntity } from '../entities/project-member-position.entity';

export class ProjectMemberPositionDto extends AbstractDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly position: string;

  constructor(entity: ProjectMemberPositionEntity) {
    super(entity);
    this.position = entity.position;
  }
}
