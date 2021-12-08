import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

import {
  AbstractDto,
  hideAbstractDtoAllProperties,
} from '../../../common/dto/abstract.dto';
import { ToUpperCase } from '../../../decorators/transforms.decorator';
import type { ProjectMemberPositionEntity } from '../entities/project-member-position.entity';

export class ProjectMemberPositionDto extends AbstractDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @ToUpperCase()
  readonly position: string;

  constructor(entity: ProjectMemberPositionEntity) {
    super(entity, hideAbstractDtoAllProperties);
    this.position = entity.position;
  }
}
