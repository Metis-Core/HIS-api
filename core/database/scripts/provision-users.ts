import 'reflect-metadata';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import { DataSource } from 'typeorm';
import { PasswordService } from 'common/services/password.service';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { User } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';
import { buildDataSourceOptions } from '../typeorm.options';

export const BOILERPLATE_PASSWORD = 'ChangeMe@123';

export type ProvisionOutcome = 'created' | 'skipped';

export async function withUsersService<T>(
  work: (usersService: UsersService) => Promise<T>,
): Promise<T> {
  const dataSource = await new DataSource(
    buildDataSourceOptions(),
  ).initialize();
  try {
    return await work(
      new UsersService(
        dataSource.getRepository(User),
        new PasswordService(),
        new EventEmitter2(),
      ),
    );
  } finally {
    await dataSource.destroy();
  }
}

export async function provisionUser(
  usersService: UsersService,
  input: CreateUserDto,
): Promise<ProvisionOutcome> {
  const dto = plainToInstance(CreateUserDto, input);
  await validateOrReject(dto);

  const existing =
    (await usersService.findByEmailOrUsername(dto.username)) ??
    (await usersService.findByEmailOrUsername(dto.email));
  if (existing) return 'skipped';

  await usersService.create(dto);
  return 'created';
}

export function errorMessage(error: unknown): string {
  if (Array.isArray(error)) {
    return error
      .flatMap((issue: { constraints?: Record<string, string> }) =>
        Object.values(issue.constraints ?? {}),
      )
      .join('; ');
  }
  return error instanceof Error ? error.message : String(error);
}
