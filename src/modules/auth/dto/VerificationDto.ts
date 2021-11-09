/* eslint-disable max-classes-per-file */
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class VerifyEmailReqDto {
  @IsString()
  @IsEmail()
  @ApiProperty()
  readonly email: string;
}

export class VerifyEmailConfirmDto {
  @IsString()
  @ApiProperty()
  readonly code: string;
}
