import { applyDecorators } from '@nestjs/common';
import { IsString, Matches, MinLength } from 'class-validator';

export const PASSWORD_MIN_LENGTH = 8;

export const IsPassword = () =>
  applyDecorators(
    IsString(),
    MinLength(PASSWORD_MIN_LENGTH),
    Matches(/[A-Za-z]/, { message: 'password must contain at least one letter' }),
    Matches(/\d/, { message: 'password must contain at least one number' }),
  );
