import type { Type } from '@nestjs/common';
import { applyDecorators, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOkResponse } from '@nestjs/swagger';

// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/explicit-module-boundary-types
export const ResponseData = <TModel extends Type<unknown>>(model?: TModel) =>
  applyDecorators(
    HttpCode(HttpStatus.OK),
    ApiOkResponse({
      type: model,
    }),
  );
