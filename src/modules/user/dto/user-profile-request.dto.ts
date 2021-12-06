import { ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMaxSize, IsNotEmpty, IsOptional } from 'class-validator';

import { ToUpperCase, Trim } from '../../../decorators/transforms.decorator';
import { IsLocaleCode } from '../../../decorators/validators.decorator';

export class UserProfileRequestDto {
  @ApiPropertyOptional({ type: [String] })
  @IsLocaleCode()
  @IsNotEmpty()
  @ArrayMaxSize(10)
  @IsOptional()
  @Trim()
  @ToUpperCase()
  readonly languages?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsNotEmpty()
  @ArrayMaxSize(20)
  @IsOptional()
  @Trim()
  @ToUpperCase()
  readonly positions?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsNotEmpty()
  @ArrayMaxSize(20)
  @IsOptional()
  @Trim()
  @ToUpperCase()
  readonly interesting?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsNotEmpty()
  @ArrayMaxSize(20)
  @IsOptional()
  @Trim()
  @ToUpperCase()
  readonly skills?: string[];
}
