import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class UserForgotPasswordDto {
  @IsString()
  @IsEmail()
  @ApiProperty()
  readonly email: string;
}
