import type {
  CallHandler,
  ExecutionContext,
  NestInterceptor,
} from '@nestjs/common';
import { Injectable, Logger } from '@nestjs/common';
import type { Observable } from 'rxjs';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class ErrorsInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ErrorsInterceptor.name);

  intercept(__: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      catchError((err) => {
        // TODO: 에러 알람 처리
        this.logger.warn(err);

        return throwError(err);
      }),
    );
  }
}
