import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from 'src/app.module';
import { UsersService } from 'src/users/users.service';
import { UserRole } from 'common/enums/userRoles.enum';
import { AccountStatus } from 'common/enums/userStatus.enum';
import { Department } from 'common/enums/department.enum';

const USERNAME = process.env.SEED_ADMIN_USERNAME ?? 'JoelAby';
const PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'A1BiPerfect@';
const EMAIL =
  process.env.SEED_ADMIN_EMAIL ?? `${USERNAME.toLowerCase()}@his.local`;

async function bootstrap(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const usersService = app.get(UsersService);

    const existing = await usersService.findByEmailOrUsername(USERNAME);
    if (existing) {
      console.log(
        `[create-admin] User "${USERNAME}" already exists (id=${existing.id}). Skipping.`,
      );
      return;
    }

    const user = await usersService.create({
      email: EMAIL,
      username: USERNAME,
      password: PASSWORD,
      role: UserRole.ADMIN,
      department: Department.ADMINISTRATION,
      status: AccountStatus.ACTIVE,
    });

    console.log('[create-admin] Admin user created:');
    console.log({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      department: user.department,
      status: user.status,
    });
  } catch (error) {
    console.error('[create-admin] Failed to create admin user:', error);
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

void bootstrap();
