import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

import { ToUpperCase } from '../../../decorators/transforms.decorator';

export class ProjectMemberApplyDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @ToUpperCase()
  readonly position: string;
}
