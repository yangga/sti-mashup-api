import { ForbiddenException } from '@nestjs/common';

export class UserWithdrawalException extends ForbiddenException {
  constructor(error?: string) {
    super('error.user_withdrawal', error);
  }
}
