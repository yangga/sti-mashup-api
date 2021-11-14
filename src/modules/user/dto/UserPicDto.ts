import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

import { Trim } from '../../../decorators/transforms.decorator';

export class UserPicDto {
  @ApiProperty()
  @IsString()
  @Trim()
  readonly id: string;

  @ApiProperty()
  @IsString()
  @Trim()
  readonly imgUrl?: string;

  constructor(id: string, imgUrl?: string) {
    this.id = id;
    this.imgUrl = imgUrl;
  }
}
