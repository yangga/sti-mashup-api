import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

import { ToUpperCase } from '../../../decorators/transforms.decorator';

export class ProjectMemberApproveDto {
  @ApiProperty()
  @IsNumber()
  readonly userId: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @ToUpperCase()
  readonly position: string;
}
