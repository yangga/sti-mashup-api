/* eslint-disable max-classes-per-file */
import { ApiProperty } from '@nestjs/swagger';
import { IsPositive, IsString } from 'class-validator';

import { Trim } from '../../../decorators/transforms.decorator';

export class SearchWordCreateDto {
  @IsString()
  @Trim()
  @ApiProperty()
  word: string;
}

export class SearchWordDto {
  @IsString()
  @Trim()
  @ApiProperty()
  word: string;

  @IsPositive()
  @ApiProperty()
  weight: number;

  constructor(word: string, weight: number) {
    this.word = word;
    this.weight = weight;
  }
}

export class SearchWordsDto {
  @ApiProperty()
  list: SearchWordDto[];

  constructor(list: SearchWordDto[]) {
    this.list = list;
  }
}
