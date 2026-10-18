import { Department } from 'common/enums/department.enum';
import { VisitIntenentsEnum as Intent } from '../enums/visit-type.enum';
import { planDoctorRouting } from './routing-plan';

describe('planDoctorRouting', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sends lab work back to the doctor for review before pharmacy', () => {
    // Arrange
    const requested = [Intent.LAB, Intent.PHARMACY];

    // Act
    const plan = planDoctorRouting(requested, []);

    // Assert
    expect(plan).toEqual([
      { intent: Intent.LAB },
      { intent: Intent.CONSULTATION, review: true },
      { intent: Intent.PHARMACY },
    ]);
  });

  it('ends at billing when no diagnostics are pending', () => {
    // Arrange
    const requested = [Intent.PHARMACY];

    // Act
    const plan = planDoctorRouting(requested, []);

    // Assert
    expect(plan).toEqual([
      { intent: Intent.PHARMACY },
      { intent: Intent.BILLING },
    ]);
  });

  it('routes straight to billing when the doctor requests nothing', () => {
    // Arrange / Act
    const plan = planDoctorRouting([], []);

    // Assert
    expect(plan).toEqual([{ intent: Intent.BILLING }]);
  });

  it('does not queue stages that are already open', () => {
    // Arrange
    const open = [Department.MAIN_LABORATORY, Department.OUTPATIENT_CLINIC];

    // Act
    const plan = planDoctorRouting([Intent.LAB, Intent.RADIOLOGY], open);

    // Assert
    expect(plan).toEqual([{ intent: Intent.RADIOLOGY }]);
  });

  it('ignores a manual billing request and de-duplicates intents', () => {
    // Arrange
    const requested = [Intent.BILLING, Intent.PHARMACY, Intent.PHARMACY];

    // Act
    const plan = planDoctorRouting(requested, []);

    // Assert
    expect(plan).toEqual([
      { intent: Intent.PHARMACY },
      { intent: Intent.BILLING },
    ]);
  });

  it('sends an admitted patient to the ward before anything else', () => {
    // Arrange
    const requested = [Intent.LAB, Intent.ADMISSION];

    // Act
    const plan = planDoctorRouting(requested, []);

    // Assert
    expect(plan).toEqual([
      { intent: Intent.ADMISSION },
      { intent: Intent.LAB },
      { intent: Intent.CONSULTATION, review: true },
    ]);
  });

  it('does not queue the ward twice when the patient is already there', () => {
    // Arrange
    const requested = [Intent.ADMISSION];

    // Act
    const plan = planDoctorRouting(requested, [Department.INPATIENT_WARD]);

    // Assert
    expect(plan).toEqual([{ intent: Intent.BILLING }]);
  });
});
