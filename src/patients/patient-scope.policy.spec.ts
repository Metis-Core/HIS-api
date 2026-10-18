import { UserRole } from 'common/enums/userRoles.enum';
import {
  PatientScope,
  patientScopeFor,
  scopeCondition,
} from './patient-scope.policy';

describe('patient scope policy', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each([
    [UserRole.LAB_TECH, PatientScope.LAB],
    [UserRole.PHARMACIST, PatientScope.PHARMACY],
    [UserRole.ACCOUNTANT, PatientScope.BILLING],
    [UserRole.DOCTOR, PatientScope.ALL],
    [UserRole.RECEPTIONIST, PatientScope.ALL],
  ])('%s sees %s patients', (role, expected) => {
    // Arrange / Act
    const scope = patientScopeFor(role);

    // Assert
    expect(scope).toBe(expected);
  });

  it('adds no condition for the full scope and a lab-order filter for lab', () => {
    // Arrange / Act
    const all = scopeCondition(PatientScope.ALL);
    const lab = scopeCondition(PatientScope.LAB);

    // Assert
    expect(all).toBeNull();
    expect(lab).toContain('"lab_orders"');
  });
});
