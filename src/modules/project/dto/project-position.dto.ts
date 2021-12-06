import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

import { ToUpperCase, Trim } from '../../../decorators/transforms.decorator';

export class ProjectPositionDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @ToUpperCase()
  @Trim()
  readonly name: string;

  @ApiProperty()
  @Min(1)
  @IsNumber()
  readonly count: number;
}
