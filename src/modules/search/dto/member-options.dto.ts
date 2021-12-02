/* eslint-disable max-classes-per-file */
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

import { Order } from '../../../common/constants/order';
import { PaginatedRequestDto } from './paginated-request.dto';

export enum SortableField {
  LEVEL = 'level',
}

export class MemberOptionsDto extends PaginatedRequestDto {
  @ApiPropertyOptional()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  readonly username?: string;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  readonly levelMin?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  readonly levelMax?: number;

  @ApiPropertyOptional({ type: [String] })
  @IsNotEmpty()
  @IsOptional()
  readonly languages?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsNotEmpty()
  @IsOptional()
  readonly positions?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsNotEmpty()
  @IsOptional()
  readonly interesting?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsNotEmpty()
  @IsOptional()
  readonly skills?: string[];

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  readonly prjCreatedMin?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  readonly prjCreatedMax?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  readonly prjStartedMin?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  readonly prjStartedMax?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  readonly prjFinishedMin?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  readonly prjFinishedMax?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  readonly prjDroppedMin?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  readonly prjDroppedMax?: number;

  @ApiPropertyOptional({ enum: SortableField })
  @IsEnum(SortableField)
  @IsOptional()
  readonly sortKey?: SortableField;

  @ApiPropertyOptional({ enum: Order })
  @IsEnum(Order)
  @IsOptional()
  readonly sortDirection?: Order;
}
