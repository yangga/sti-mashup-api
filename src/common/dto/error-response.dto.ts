/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable max-classes-per-file */
import type { ValidationError } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNumber, IsObject, IsString } from 'class-validator';

export class ErrorResponseDto {
  @ApiProperty()
  @IsNumber()
  statusCode: number;

  @ApiProperty()
  @IsString()
  message: string;

  @ApiPropertyOptional()
  @IsString()
  error?: string;
}

export class ValidationErrorResponseDto implements ValidationError {
  @ApiPropertyOptional()
  @IsObject()
  target?: Record<string, any> | undefined;

  @ApiProperty()
  @IsString()
  property: string;

  @ApiPropertyOptional()
  @IsObject()
  value?: any;

  @ApiPropertyOptional()
  @IsObject()
  constraints?: Record<string, string> | undefined;

  @ApiPropertyOptional()
  @IsArray()
  children?: ValidationError[] | undefined;

  @ApiPropertyOptional()
  contexts?: Record<string, any> | undefined;
}
