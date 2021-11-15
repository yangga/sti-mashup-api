import { ForbiddenException } from '@nestjs/common';

export class EmailAlreadyUsedException extends ForbiddenException {
  constructor(error?: string) {
    super('error.email_already_used', error);
  }
}
