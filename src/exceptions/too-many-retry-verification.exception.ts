import { HttpException, HttpStatus } from '@nestjs/common';

export class TooManyVerificationException extends HttpException {
  constructor(error?: string) {
    super(
      HttpException.createBody(
        error || 'error.verification_token_too_many_request',
        'Too many requests',
        HttpStatus.TOO_MANY_REQUESTS,
      ),
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
