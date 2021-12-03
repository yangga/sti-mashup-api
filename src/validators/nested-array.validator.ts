import { applyDecorators } from '@nestjs/common';
import type { TypeHelpOptions } from 'class-transformer';
import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';

export function NestedArray({
  type,
}: {
  // eslint-disable-next-line @typescript-eslint/ban-types
  type: (type?: TypeHelpOptions) => Function;
}): PropertyDecorator {
  return applyDecorators(IsArray(), ValidateNested({ each: true }), Type(type));
}
