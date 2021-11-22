import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

import { Match } from '../../../decorators/match.decorator';
import { Trim } from '../../../decorators/transforms.decorator';

export class UserResetPasswordDto {
  @IsString()
  @IsEmail()
  @ApiProperty()
  readonly email: string;

  @ApiProperty()
  @IsString()
  @MinLength(4)
  @MaxLength(20)
  @Trim()
  @Matches(/((?=.*\d)|(?=.*\W+))(?![\n.])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'password too weak',
  })
  readonly password: string;

  @ApiProperty()
  @IsString()
  @MinLength(4)
  @MaxLength(20)
  @Match('password')
  @Trim()
  readonly passwordConfirm: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Trim()
  readonly verificationCode: string;
}
