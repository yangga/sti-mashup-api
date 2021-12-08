import { ConflictException } from '@nestjs/common';

export class DuplicatedRequestException extends ConflictException {
  constructor(error?: string) {
    super('error.duplicated_request', error);
  }
}
