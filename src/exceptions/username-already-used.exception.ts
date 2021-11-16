import { ForbiddenException } from '@nestjs/common';

export class UsernameAlreadyUsedException extends ForbiddenException {
  constructor(error?: string) {
    super('error.username_already_used', error);
  }
}
