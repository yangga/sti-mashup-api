import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

import { CommonHeaderKeys } from '../../decorators/common-header.decorator';

export class CommonHeaderDto {
  @ApiProperty({ description: 'Locale of user' })
  @IsString()
  @IsNotEmpty()
  @Expose({ name: CommonHeaderKeys.Locale })
  locale = 'en';
}
