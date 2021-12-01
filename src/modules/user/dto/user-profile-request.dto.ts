import { ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMaxSize, IsNotEmpty, IsOptional } from 'class-validator';

import { Trim } from '../../../decorators/transforms.decorator';
import { IsLocaleCode } from '../../../decorators/validators.decorator';

export class UserProfileRequestDto {
  @ApiPropertyOptional({ type: [String] })
  @IsLocaleCode()
  @IsNotEmpty()
  @ArrayMaxSize(10)
  @IsOptional()
  @Trim()
  readonly languages?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsNotEmpty()
  @ArrayMaxSize(20)
  @IsOptional()
  @Trim()
  readonly positions?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsNotEmpty()
  @ArrayMaxSize(20)
  @IsOptional()
  @Trim()
  readonly interesting?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsNotEmpty()
  @ArrayMaxSize(20)
  @IsOptional()
  @Trim()
  readonly skills?: string[];
}
