import { HttpException, HttpStatus } from '@nestjs/common';

export class ProjectInvolvedToomanyException extends HttpException {
  constructor(error?: string) {
    super(
      HttpException.createBody(
        error || 'error.project_involved_toomany',
        'Too many requests',
        HttpStatus.TOO_MANY_REQUESTS,
      ),
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
