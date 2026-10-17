import { plainToInstance } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  ValidateIf,
  validateSync,
} from 'class-validator';

const MIN_SECRET_LENGTH = 32;

export class EnvironmentVariablesDTO {
  @IsOptional()
  @IsIn(['development', 'test', 'production'], {
    message: 'NODE_ENV must be development, test or production',
  })
  NODE_ENV?: string;

  @IsOptional()
  @IsInt({ message: 'PORT must be an integer' })
  @Min(1)
  @Max(65535)
  PORT?: number;

  @ValidateIf((env: EnvironmentVariablesDTO) => env.NODE_ENV === 'production')
  @IsNotEmpty({ message: 'CORS_ORIGINS is required in production' })
  @IsString()
  CORS_ORIGINS?: string;

  @IsNotEmpty({ message: 'DB_HOST is required' })
  @IsString()
  DB_HOST: string;

  @IsOptional()
  @IsInt({ message: 'DB_PORT must be an integer' })
  DB_PORT?: number;

  @IsNotEmpty({ message: 'DB_USERNAME is required' })
  @IsString()
  DB_USERNAME: string;

  @IsNotEmpty({ message: 'DB_PASSWORD is required' })
  @IsString()
  DB_PASSWORD: string;

  @IsNotEmpty({ message: 'DB_NAME is required' })
  @IsString()
  DB_NAME: string;

  @IsString()
  @MinLength(MIN_SECRET_LENGTH, {
    message: `JWT_ACCESS_SECRET must be at least ${MIN_SECRET_LENGTH} characters`,
  })
  JWT_ACCESS_SECRET: string;

  @IsString()
  @MinLength(MIN_SECRET_LENGTH, {
    message: `JWT_REFRESH_SECRET must be at least ${MIN_SECRET_LENGTH} characters`,
  })
  JWT_REFRESH_SECRET: string;

  @IsOptional()
  @IsIn(['true', 'false'], { message: 'DB_SYNCHRONIZE must be true or false' })
  DB_SYNCHRONIZE?: string;

  @IsOptional()
  @IsIn(['true', 'false'], {
    message: 'DB_RUN_MIGRATIONS must be true or false',
  })
  DB_RUN_MIGRATIONS?: string;

  @IsOptional()
  @IsString()
  JWT_ACCESS_EXPIRES_IN?: string;

  @IsOptional()
  @IsString()
  JWT_REFRESH_EXPIRES_IN?: string;
}

export function validateEnv(
  config: Record<string, unknown>,
): EnvironmentVariablesDTO {
  const env = plainToInstance(EnvironmentVariablesDTO, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(env, { skipMissingProperties: false });
  if (errors.length === 0) return env;

  const messages = errors.flatMap((e) => Object.values(e.constraints ?? {}));
  throw new Error(
    `Invalid environment configuration:\n- ${messages.join('\n- ')}`,
  );
}
