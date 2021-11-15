/* eslint-disable max-classes-per-file */
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

import { Trim } from '../../../decorators/transforms.decorator';

export class VerifyEmailReqDto {
  @IsString()
  @IsEmail()
  @Trim()
  @ApiProperty()
  readonly email: string;
}

export class VerifyEmailConfirmDto {
  @IsString()
  @Trim()
  @ApiProperty()
  readonly code: string;
}
