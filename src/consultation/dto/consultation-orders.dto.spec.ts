import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  CreateConsultationLabOrderDTO,
  CreateConsultationPrescriptionDTO,
} from './consultation-orders.dto';

const TEST_ID = '6f1c2b8e-3d4a-4f5b-9c6d-7e8f9a0b1c2d';
const strict = { whitelist: true, forbidNonWhitelisted: true };

describe('consultation order DTOs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('accepts a valid lab order', async () => {
    // Arrange
    const body = { items: [{ testId: TEST_ID }] };

    // Act
    const errors = await validate(
      plainToInstance(CreateConsultationLabOrderDTO, body),
      strict,
    );

    // Assert
    expect(errors).toHaveLength(0);
  });

  it('rejects a lab item without a valid test id', async () => {
    // Arrange
    const body = { items: [{ testId: 'not-a-uuid' }] };

    // Act
    const errors = await validate(
      plainToInstance(CreateConsultationLabOrderDTO, body),
      strict,
    );

    // Assert
    expect(errors.map((e) => e.property)).toEqual(['items']);
  });

  it('refuses a patient id in the body', async () => {
    // Arrange
    const body = { patientId: TEST_ID, items: [{ testId: TEST_ID }] };

    // Act
    const errors = await validate(
      plainToInstance(CreateConsultationLabOrderDTO, body),
      strict,
    );

    // Assert
    expect(errors.map((e) => e.property)).toContain('patientId');
  });

  it('rejects a prescription line without a dosage or quantity', async () => {
    // Arrange
    const body = { items: [{ itemId: TEST_ID, frequency: 'TDS' }] };

    // Act
    const errors = await validate(
      plainToInstance(CreateConsultationPrescriptionDTO, body),
      strict,
    );

    // Assert
    const [itemErrors] = errors[0].children ?? [];
    const failed = itemErrors?.children?.map((e) => e.property) ?? [];
    expect(failed).toEqual(expect.arrayContaining(['dosage', 'quantity']));
  });
});
