import { applyDecorators } from '@nestjs/common';
import type { ApiHeaderOptions } from '@nestjs/swagger';
import { ApiHeaders } from '@nestjs/swagger';

export enum CommonHeaderKeys {
  Locale = 'locale',
}

const headerOptions: Record<CommonHeaderKeys, ApiHeaderOptions> = {
  [CommonHeaderKeys.Locale]: {
    name: 'Locale',
    description: '사용자 언어 Locale',
    required: false,
    schema: { type: 'string' },
    example: 'en',
  },
};
// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/explicit-module-boundary-types
export const CommonHeader = () =>
  applyDecorators(ApiHeaders(Object.values(headerOptions)));
