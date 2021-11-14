import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

import { Match } from '../../../decorators/match.decorator';
import { Trim } from '../../../decorators/transforms.decorator';

export class UserRegisterDto {
  @ApiProperty()
  @IsString()
  @MinLength(4)
  @MaxLength(20)
  @Trim()
  readonly username: string;

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
  readonly registerCode: string;
}
