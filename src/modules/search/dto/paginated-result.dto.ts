import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive } from 'class-validator';

export class PaginatedResultDto<T> {
  @ApiProperty({ isArray: true })
  readonly data: T[];

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  readonly total: number;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  readonly from: number;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  readonly size: number;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  readonly took: number;

  constructor(
    data: T[],
    total: number,
    from: number,
    size: number,
    took: number,
  ) {
    this.data = data;
    this.total = total;
    this.from = from;
    this.size = size;
    this.took = took;
  }
}
