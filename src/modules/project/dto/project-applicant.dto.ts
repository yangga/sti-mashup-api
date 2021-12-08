import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import _ from 'lodash';

import {
  AbstractDto,
  hideAbstractDtoAllProperties,
} from '../../../common/dto/abstract.dto';
import { ToUpperCase } from '../../../decorators/transforms.decorator';
import { UserDto } from '../../user/dto/user.dto';
import type { ProjectApplicantEntity } from '../entities/project-applicant.entity';

export class ProjectApplicantDto extends AbstractDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @ToUpperCase()
  readonly position: string;

  @ApiProperty({ type: () => UserDto })
  readonly user: UserDto;

  constructor(entity: ProjectApplicantEntity) {
    super(entity, hideAbstractDtoAllProperties);
    this.position = entity.position;
    this.user = entity.user.toDto();
  }
}
