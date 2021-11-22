import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

import { Trim } from '../../../decorators/transforms.decorator';

export class UserPicDto {
  @ApiProperty()
  @IsNumber()
  readonly id: number;

  @ApiProperty()
  @IsString()
  @Trim()
  readonly imgUrl?: string;

  constructor(id: number, imgUrl?: string | null) {
    this.id = id;
    this.imgUrl = imgUrl ? imgUrl : undefined;
  }
}
