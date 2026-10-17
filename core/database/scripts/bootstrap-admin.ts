import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from 'src/app.module';
import { UsersService } from 'src/users/users.service';
import { UserRole } from 'common/enums/userRoles.enum';
import { AccountStatus } from 'common/enums/userStatus.enum';
import { Department } from 'common/enums/department.enum';
import { requireEnv } from './require-env';

async function bootstrap(): Promise<void> {
  const username = requireEnv('SEED_ADMIN_USERNAME');
  const email = requireEnv('SEED_ADMIN_EMAIL');
  const password = requireEnv('SEED_ADMIN_PASSWORD');

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    const usersService = app.get(UsersService);
    if (await usersService.findByEmailOrUsername(username)) {
      console.log(
        `[bootstrap-admin] "${username}" already exists. Nothing to do.`,
      );
      return;
    }

    const user = await usersService.create({
      email,
      username,
      password,
      role: UserRole.SUPER_ADMIN,
      department: Department.ADMINISTRATION,
      status: AccountStatus.PENDING_RESET,
    });
    console.log(
      `[bootstrap-admin] Created super admin "${user.username}" (must change password on first login).`,
    );
  } catch (error) {
    console.error(
      '[bootstrap-admin] Failed:',
      error instanceof Error ? error.message : error,
    );
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

void bootstrap();
