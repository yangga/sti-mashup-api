import { ForbiddenException } from '@nestjs/common';

export class UserBlockedException extends ForbiddenException {
  constructor(error?: string) {
    super('error.user_blocked', error);
  }
}
