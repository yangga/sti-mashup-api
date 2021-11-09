import { ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

import { CommonHeaderKeys } from '../../decorators/common-header.decorator';

export class CommonHeaderDto {
  @ApiPropertyOptional({ description: 'Locale of user' })
  @IsString()
  @IsOptional()
  @Expose({ name: CommonHeaderKeys.Locale })
  locale = 'en';
}
