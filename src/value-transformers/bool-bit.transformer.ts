import type { ValueTransformer } from 'typeorm';

export class BoolBitTransformer implements ValueTransformer {
  to(value: boolean | null): Buffer | undefined {
    if (value === null) {
      return undefined;
    }

    const res = Buffer.alloc(1);
    res[0] = value ? 1 : 0;

    return res;
  }

  from(value: Buffer): boolean | undefined {
    if (value === null) {
      return undefined;
    }

    return value[0] === 1;
  }
}
