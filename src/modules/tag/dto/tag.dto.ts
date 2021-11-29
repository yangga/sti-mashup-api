/* eslint-disable max-classes-per-file */
import { ApiProperty } from '@nestjs/swagger';

export class TagDto {
  @ApiProperty()
  word: string;

  @ApiProperty()
  weight: number;

  constructor(word: string, weight: number) {
    this.word = word;
    this.weight = weight;
  }
}

export class TagsDto {
  @ApiProperty()
  tags: TagDto[];

  constructor(tags: TagDto[]) {
    this.tags = tags;
  }
}
