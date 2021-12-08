import { ApiPropertyOptional } from '@nestjs/swagger';

import type { AbstractEntity } from '../abstract.entity';

export interface IInitOptions {
  hideId: boolean;
  hideCreatedAt: boolean;
  hideUpdatedAt: boolean;
}

const defaultInitOptions: IInitOptions = {
  hideId: false,
  hideCreatedAt: false,
  hideUpdatedAt: false,
};

export const hideAbstractDtoAllProperties: IInitOptions = {
  hideId: true,
  hideCreatedAt: true,
  hideUpdatedAt: true,
};

export class AbstractDto {
  @ApiPropertyOptional()
  id: number;

  @ApiPropertyOptional()
  createdAt: Date;

  @ApiPropertyOptional()
  updatedAt: Date;

  constructor(
    entity: AbstractEntity,
    options: IInitOptions = defaultInitOptions,
  ) {
    if (!options.hideId) {
      this.id = entity.id;
    }

    if (!options.hideCreatedAt) {
      this.createdAt = entity.createdAt;
    }

    if (!options.hideUpdatedAt) {
      this.updatedAt = entity.updatedAt;
    }
  }
}
