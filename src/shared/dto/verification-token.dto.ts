import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsString } from 'class-validator';

export class VerificationTokenDto {
  @ApiProperty()
  @IsString()
  action: string;

  @ApiPropertyOptional()
  @IsObject()
  data?: unknown;
}
