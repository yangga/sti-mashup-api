/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable max-classes-per-file */
import type { ValidationError } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class ErrorResponseDto {
  @ApiProperty()
  @IsNumber()
  statusCode: number;

  @ApiProperty()
  @IsString()
  message: string;

  @ApiProperty()
  @IsString()
  error?: string;
}

export class ValidationErrorResponseDto implements ValidationError {
  @ApiProperty()
  @IsObject()
  target?: Record<string, any> | undefined;

  @ApiProperty()
  @IsString()
  property: string;

  @ApiProperty()
  @IsObject()
  value?: any;

  @ApiProperty()
  @IsObject()
  constraints?: Record<string, string> | undefined;

  @ApiProperty()
  @IsOptional()
  @IsArray()
  children?: ValidationError[] | undefined;

  @ApiProperty()
  @IsObject()
  contexts?: Record<string, any> | undefined;
}
