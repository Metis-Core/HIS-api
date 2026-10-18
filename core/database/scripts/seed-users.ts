import { Logger } from '@nestjs/common';
import { UserRole } from 'common/enums/userRoles.enum';
import { AccountStatus } from 'common/enums/userStatus.enum';
import { Department } from 'common/enums/department.enum';
import {
  BOILERPLATE_PASSWORD,
  errorMessage,
  provisionUser,
  withUsersService,
} from './provision-users';

const SEED_USERS = [
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
] as const;

const logger = new Logger('SeedUsers');

async function seedUsers(): Promise<void> {
  await withUsersService(async (usersService) => {
    for (const { key, role, department } of SEED_USERS) {
      const username = `${key}metis`;
      try {
        const outcome = await provisionUser(usersService, {
          username,
          email: `${username}@his.local`,
          password: BOILERPLATE_PASSWORD,
          role,
          department,
          status: AccountStatus.PENDING_RESET,
        });
        logger.log(`${username} (${role}): ${outcome}`);
      } catch (error) {
        logger.error(`${username}: ${errorMessage(error)}`);
        process.exitCode = 1;
      }
    }
  });
}

seedUsers().catch((error: unknown) => {
  logger.error(errorMessage(error));
  process.exitCode = 1;
});
