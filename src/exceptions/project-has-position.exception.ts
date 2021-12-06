import { PreconditionFailedException } from '@nestjs/common';

export class ProjectHasPositionException extends PreconditionFailedException {
  constructor(error?: string) {
    super('error.project_has_position', error);
  }
}
