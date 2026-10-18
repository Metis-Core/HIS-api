import { ForbiddenException } from '@nestjs/common';
import { UserRole } from 'common/enums/userRoles.enum';
import { AccountStatus } from 'common/enums/userStatus.enum';
import {
  assertCanDelete,
  assertCanManage,
  assertCanView,
} from './user-access.policy';

const admin = { id: 'admin-1', role: UserRole.ADMIN };
const superAdmin = { id: 'super-1', role: UserRole.SUPER_ADMIN };
const nurse = { id: 'nurse-1', role: UserRole.NURSE };

describe('user access policy', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lets a user view their own account', () => {
    // Arrange
    const targetId = nurse.id;
    // Act
    const act = () => assertCanView(nurse, targetId);
    // Assert
    expect(act).not.toThrow();
  });

  it('blocks a non-admin from viewing another account', () => {
    // Arrange
    const targetId = admin.id;
    // Act
    const act = () => assertCanView(nurse, targetId);
    // Assert
    expect(act).toThrow(ForbiddenException);
  });

  it('blocks a non-admin from changing their own role', () => {
    // Arrange
    const target = { id: nurse.id, role: UserRole.NURSE };
    // Act
    const act = () => assertCanManage(nurse, target, { role: UserRole.ADMIN });
    // Assert
    expect(act).toThrow(ForbiddenException);
  });

  it('lets an admin change another staff role', () => {
    // Arrange
    const target = { id: nurse.id, role: UserRole.NURSE };
    // Act
    const act = () => assertCanManage(admin, target, { role: UserRole.DOCTOR });
    // Assert
    expect(act).not.toThrow();
  });

  it('blocks an admin from granting super admin', () => {
    // Arrange
    const target = { id: nurse.id, role: UserRole.NURSE };
    // Act
    const act = () =>
      assertCanManage(admin, target, { role: UserRole.SUPER_ADMIN });
    // Assert
    expect(act).toThrow(ForbiddenException);
  });

  it('blocks an admin from editing a super admin', () => {
    // Arrange
    const target = { id: superAdmin.id, role: UserRole.SUPER_ADMIN };
    // Act
    const act = () => assertCanManage(admin, target, { email: 'x@y.z' });
    // Assert
    expect(act).toThrow(ForbiddenException);
  });

  it('blocks an admin from changing their own status', () => {
    // Arrange
    const target = { id: admin.id, role: UserRole.ADMIN };
    // Act
    const act = () =>
      assertCanManage(admin, target, { status: AccountStatus.SUSPENDED });
    // Assert
    expect(act).toThrow(ForbiddenException);
  });

  it('lets a super admin manage another super admin', () => {
    // Arrange
    const target = { id: 'super-2', role: UserRole.SUPER_ADMIN };
    // Act
    const act = () =>
      assertCanManage(superAdmin, target, { status: AccountStatus.ACTIVE });
    // Assert
    expect(act).not.toThrow();
  });

  it('blocks deleting your own account', () => {
    // Arrange
    const target = { id: admin.id, role: UserRole.ADMIN };
    // Act
    const act = () => assertCanDelete(admin, target);
    // Assert
    expect(act).toThrow(ForbiddenException);
  });
});
