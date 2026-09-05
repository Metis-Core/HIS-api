import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from 'src/app.module';
import { UsersService } from 'src/users/users.service';
import { UserRole } from 'common/enums/userRoles.enum';
import { AccountStatus } from 'common/enums/userStatus.enum';
import { Department } from 'common/enums/department.enum';

interface SeedUserSpec {
  readonly key: string;
  readonly role: UserRole;
  readonly department: Department;
}

const SEED_USERS: readonly SeedUserSpec[] = [
  { key: 'superadmin', role: UserRole.SUPER_ADMIN, department: Department.ADMINISTRATION },
  { key: 'admin', role: UserRole.ADMIN, department: Department.ADMINISTRATION },
  { key: 'doctor', role: UserRole.DOCTOR, department: Department.OUTPATIENT_CLINIC },
  { key: 'nurse', role: UserRole.NURSE, department: Department.TRIAGE },
  { key: 'labtech', role: UserRole.LAB_TECH, department: Department.MAIN_LABORATORY },
  { key: 'pharmacist', role: UserRole.PHARMACIST, department: Department.MAIN_PHARMACY },
  { key: 'receptionist', role: UserRole.RECEPTIONIST, department: Department.RECEPTION },
  { key: 'accountant', role: UserRole.ACCOUNTANT, department: Department.FINANCE },
  { key: 'patient', role: UserRole.PATIENT, department: Department.RECEPTION },
];

const buildUsername = (key: string): string => `${key}metis`;
const buildPassword = (key: string): string => `${key}metis@#`;
const buildEmail = (key: string): string => `${key}metis@his.local`;

async function bootstrap(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  const created: Array<{ username: string; role: UserRole; department: Department }> = [];
  const skipped: string[] = [];
  const failed: Array<{ username: string; error: string }> = [];

  try {
    const usersService = app.get(UsersService);

    for (const spec of SEED_USERS) {
      const username = buildUsername(spec.key);
      const password = buildPassword(spec.key);
      const email = buildEmail(spec.key);

      try {
        const existing = await usersService.findByEmailOrUsername(username);
        if (existing) {
          console.log(
            `[seed-users] "${username}" already exists (id=${existing.id}). Skipping.`,
          );
          skipped.push(username);
          continue;
        }

        const user = await usersService.create({
          email,
          username,
          password,
          role: spec.role,
          department: spec.department,
          status: AccountStatus.ACTIVE,
        });

        console.log(
          `[seed-users] Created ${spec.role} -> username="${user.username}", password="${password}"`,
        );
        created.push({ username: user.username, role: user.role, department: user.department });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`[seed-users] Failed to create "${username}": ${message}`);
        failed.push({ username, error: message });
      }
    }

    console.log('\n[seed-users] Summary');
    console.log(`  created: ${created.length}`);
    console.log(`  skipped: ${skipped.length}`);
    console.log(`  failed : ${failed.length}`);
    if (created.length > 0) {
      console.table(
        created.map((entry) => ({
          username: entry.username,
          password: buildPassword(entry.username.replace(/metis$/, '')),
          role: entry.role,
          department: entry.department,
        })),
      );
    }
  } catch (error) {
    console.error('[seed-users] Fatal error:', error);
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

void bootstrap();
