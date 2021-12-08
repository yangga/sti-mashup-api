/* eslint-disable max-classes-per-file */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
import { SimpleValidate } from '../../../validators/simple.validator';
import { ProjectPositionDto } from './project-position.dto';

export class ProjectRegisterDto {
  @ApiProperty({ type: [String] })
  @ArrayNotEmpty()
  @ToUpperCase()
  @Trim()
  readonly languages: string[];

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly title: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly descriptionHtml: string;

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
  @IsNotEmpty()
  @IsString()
  @ToUpperCase()
  @Trim()
  @SimpleValidate({
    validate: (value: string, obj: ProjectRegisterDto) => {
      const l = value.toUpperCase();

      return (
        obj.positions.findIndex(
          (pos) => pos.name.toUpperCase().localeCompare(l) === 0,
        ) >= 0
      );
    },
  })
  readonly myPosition?: string;

  @ApiProperty()
  @ArrayNotEmpty()
  @NestedArray({
    type: () => ProjectPositionDto,
  })
  readonly positions: ProjectPositionDto[];
}
