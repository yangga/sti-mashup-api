/* eslint-disable max-classes-per-file */
import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
} from 'class-validator';

import { NestedArray } from '../../../validators/nested-array.validator';
import { SimpleValidate } from '../../../validators/simple.validator';

export class ProjectPositionDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly name: string;

  @ApiProperty()
  @Min(1)
  @IsNumber()
  readonly count: number;
}

export class ProjectRegisterDto {
  @ApiProperty({ type: [String] })
  @ArrayNotEmpty()
  readonly languages: string[];

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly title: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly descriptionHtml: string;

  @ApiProperty({ type: [String] })
  @ArrayNotEmpty()
  readonly tags: string[];

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @SimpleValidate({
    validate: (value: string, obj: ProjectRegisterDto) => {
      const l = value.toLowerCase();

      return (
        obj.positions.findIndex(
          (pos) => pos.name.toLowerCase().localeCompare(l) === 0,
        ) >= 0
      );
    },
  })
  readonly myPosition: string;

  @ApiProperty()
  @ArrayNotEmpty()
  @NestedArray({
    type: () => ProjectPositionDto,
  })
  readonly positions: ProjectPositionDto[];
}
