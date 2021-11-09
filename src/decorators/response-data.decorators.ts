import type { Type } from '@nestjs/common';
import { applyDecorators, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiDefaultResponse,
  ApiOkResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';

import {
  ErrorResponseDto,
  ValidationErrorResponseDto,
} from '../common/dto/error-response.dto';

// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/explicit-module-boundary-types
export const ResponseData = <TModel extends Type<unknown>>(model?: TModel) =>
  applyDecorators(
    HttpCode(HttpStatus.OK),
    ApiOkResponse({
      type: model,
    }),
    ApiUnprocessableEntityResponse({
      type: ValidationErrorResponseDto,
    }),
    ApiDefaultResponse({
      type: ErrorResponseDto,
    }),
  );
