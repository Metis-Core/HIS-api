import { Department } from 'common/enums/department.enum';
import { UserRole } from 'common/enums/userRoles.enum';
import { canActOnStage, canRouteClinically } from './department-access.policy';

describe('department access policy', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each([
    [UserRole.LAB_TECH, Department.MAIN_LABORATORY, true],
    [UserRole.LAB_TECH, Department.MAIN_PHARMACY, false],
    [UserRole.PHARMACIST, Department.MAIN_PHARMACY, true],
    [UserRole.RECEPTIONIST, Department.OUTPATIENT_CLINIC, false],
    [UserRole.NURSE, Department.TRIAGE, true],
    [UserRole.ACCOUNTANT, Department.FINANCE, true],
    [UserRole.ADMIN, Department.MAIN_LABORATORY, true],
  ])('%s acting on %s -> %s', (role, department, expected) => {
    // Arrange / Act
    const allowed = canActOnStage(role, department);

    // Assert
    expect(allowed).toBe(expected);
  });

  it('lets only doctors route patients to clinical departments', () => {
    // Arrange
    const roles = Object.values(UserRole);

    // Act
    const routers = roles.filter((role) => canRouteClinically(role));

    // Assert
    expect(routers).toEqual([UserRole.DOCTOR]);
  });
});
