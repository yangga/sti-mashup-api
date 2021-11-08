import type { ExecutionContext } from '@nestjs/common';
import { createParamDecorator } from '@nestjs/common';
import type { ClassConstructor } from 'class-transformer';
import { plainToClass } from 'class-transformer';
import { validateOrReject } from 'class-validator';

// eslint-disable-next-line @typescript-eslint/naming-convention
export const RequestHeader = createParamDecorator(
  async (value: ClassConstructor<unknown>, ctx: ExecutionContext) => {
    // extract headers
    const headers = ctx.switchToHttp().getRequest().headers;

    // Convert headers to DTO object
    const dto = plainToClass(value, headers, {
      excludeExtraneousValues: true,
    }) as Record<string, unknown>;

    // Validate
    await validateOrReject(dto);

    // return header dto object
    return dto;
  },
);
