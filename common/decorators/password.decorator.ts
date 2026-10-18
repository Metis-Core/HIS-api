import { registerDecorator, ValidationOptions } from 'class-validator';
import { passwordProblems } from 'common/security/password-policy';

export function IsPassword(options?: ValidationOptions): PropertyDecorator {
  return (target, propertyKey) =>
    registerDecorator({
      name: 'isPassword',
      target: target.constructor,
      propertyName: propertyKey as string,
      options,
      validator: {
        validate: (value: unknown) =>
          typeof value === 'string' && passwordProblems(value).length === 0,
        defaultMessage: (args) =>
          typeof args?.value === 'string'
            ? `password must ${passwordProblems(args.value).join(', ')}`
            : 'password must be a string',
      },
    });
}
