import type { ValidationArguments, ValidationOptions } from 'class-validator';
import { registerDecorator } from 'class-validator';

import LocaleCodes from '../i18n/locale-short-codes.json';

export function IsPassword(
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return (object, propertyName: string) => {
    registerDecorator({
      propertyName,
      name: 'isPassword',
      target: object.constructor,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: string, _args: ValidationArguments) {
          return /^[\d!#$%&*@A-Z^a-z]*$/.test(value);
        },
      },
    });
  };
}

export function IsLocaleCode(
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return (object, propertyName: string) => {
    registerDecorator({
      propertyName,
      name: 'isLocaleCode',
      target: object.constructor,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: string | string[], _args: ValidationArguments) {
          if (Array.isArray(value)) {
            for (const v of value) {
              if (!LocaleCodes.includes(v.toUpperCase())) {
                return false;
              }
            }

            return true;
          }

          return LocaleCodes.includes(value.toUpperCase());
        },
      },
    });
  };
}
