import { NotFoundException } from '@nestjs/common';

export class TokenNotFoundException extends NotFoundException {
  constructor(error?: string) {
    super('error.token_not_found', error);
  }
}
