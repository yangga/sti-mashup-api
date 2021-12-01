import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { SearchWordType } from '../search.enum';

export class AutoCompletionOptionsDto {
  @ApiPropertyOptional({
    enum: SearchWordType,
  })
  @IsEnum(SearchWordType)
  readonly type: SearchWordType;

  @ApiPropertyOptional()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  readonly q: string;
}
