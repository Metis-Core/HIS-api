import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from 'src/app.module';
import { UsersService } from 'src/users/users.service';
import { UserRole } from 'common/enums/userRoles.enum';
import { AccountStatus } from 'common/enums/userStatus.enum';
import { Department } from 'common/enums/department.enum';
import { requireEnv } from './require-env';

interface SeedUserSpec {
  readonly key: string;
  readonly role: UserRole;
  readonly department: Department;
}

const SEED_USERS: readonly SeedUserSpec[] = [
  {
    key: 'superadmin',
    role: UserRole.SUPER_ADMIN,
    department: Department.ADMINISTRATION,
  },
  { key: 'admin', role: UserRole.ADMIN, department: Department.ADMINISTRATION },
  {
    key: 'doctor',
    role: UserRole.DOCTOR,
    department: Department.OUTPATIENT_CLINIC,
  },
  { key: 'nurse', role: UserRole.NURSE, department: Department.TRIAGE },
  {
    key: 'labtech',
    role: UserRole.LAB_TECH,
    department: Department.MAIN_LABORATORY,
  },
  {
    key: 'pharmacist',
    role: UserRole.PHARMACIST,
    department: Department.MAIN_PHARMACY,
  },
  {
    key: 'receptionist',
    role: UserRole.RECEPTIONIST,
    department: Department.RECEPTION,
  },
  {
    key: 'accountant',
    role: UserRole.ACCOUNTANT,
    department: Department.FINANCE,
  },
];

const buildUsername = (key: string): string => `${key}metis`;
const buildEmail = (key: string): string => `${key}metis@his.local`;

async function seedOne(
  usersService: UsersService,
  spec: SeedUserSpec,
  password: string,
): Promise<string> {
  const username = buildUsername(spec.key);
  if (await usersService.findByEmailOrUsername(username)) return 'skipped';

  await usersService.create({
    email: buildEmail(spec.key),
    username,
    password,
    role: spec.role,
    department: spec.department,
    status: AccountStatus.PENDING_RESET,
  });
  return 'created';
}

async function bootstrap(): Promise<void> {
  // Shared initial password; every seeded account must change it on first login.
  const password = requireEnv('SEED_USER_PASSWORD');
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    const usersService = app.get(UsersService);
    for (const spec of SEED_USERS) {
      const username = buildUsername(spec.key);
      try {
        console.log(
          `[seed-users] ${username} (${spec.role}): ${await seedOne(usersService, spec, password)}`,
        );
      } catch (error) {
        console.error(
          `[seed-users] ${username}: failed - ${error instanceof Error ? error.message : error}`,
        );
        process.exitCode = 1;
      }
    }
  } finally {
    await app.close();
  }
}

void bootstrap();
