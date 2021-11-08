import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class UserSignupDto {
  @IsString()
  @IsEmail()
  @ApiProperty()
  readonly email: string;
}
