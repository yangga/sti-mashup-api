import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

import type { UserSettingsEntity } from '../entities/user-settings.entity';

export class UserSettingsDto {
  @ApiPropertyOptional({ type: Date })
  @IsDateString()
  @IsOptional()
  readonly agreeMarketingAt?: Date | null;

  constructor(settings: UserSettingsEntity) {
    if (!settings) {
      return;
    }

    this.agreeMarketingAt = settings.agreeMarketingAt;
  }
}
