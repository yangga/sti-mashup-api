/* eslint-disable max-classes-per-file */
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

import { ToUpperCase, Trim } from '../../../decorators/transforms.decorator';
import { NestedArray } from '../../../validators/nested-array.validator';
import { ProjectPositionDto } from './project-position.dto';

export class ProjectUpdateDto {
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @ArrayNotEmpty()
  @ToUpperCase()
  @Trim()
  readonly languages?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  readonly title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  readonly descriptionHtml?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  readonly teamIntroHtml?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  readonly profitShare?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @ToUpperCase()
  @Trim()
  readonly skills?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @ArrayNotEmpty()
  @ToUpperCase()
  @Trim()
  readonly tags?: string[];

  @ApiPropertyOptional({ type: Date })
  @IsDateString()
  @IsOptional()
  readonly beginAt?: Date;

  @ApiPropertyOptional()
  @Min(1)
  @IsNumber()
  @IsOptional()
  readonly period?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @ArrayNotEmpty()
  @NestedArray({
    type: () => ProjectPositionDto,
  })
  readonly positions?: ProjectPositionDto[];
}
