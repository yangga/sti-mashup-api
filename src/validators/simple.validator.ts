import type { ValidationArguments, ValidationOptions } from 'class-validator';
import { registerDecorator } from 'class-validator';

export function SimpleValidate({
  validate,
  validationOptions,
}: {
  validate: (value: unknown, object: unknown) => Promise<boolean> | boolean;
  validationOptions?: ValidationOptions;
}): PropertyDecorator {
  return function (object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate: (
          value: unknown,
          validationArguments?: ValidationArguments,
        ): Promise<boolean> | boolean => {
          if (!validationArguments) {
            return false;
          }

          return validate(value, validationArguments.object);
        },
      },
    });
  };
}
