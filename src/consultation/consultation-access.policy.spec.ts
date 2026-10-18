import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { UserRole } from 'common/enums/userRoles.enum';
import {
  assertCanAssignDoctor,
  assertCanEditConsultation,
  assertIsDoctor,
} from './consultation-access.policy';

const doctor = { id: 'd1', role: UserRole.DOCTOR };

describe('consultation access policy', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lets the assigned doctor edit', () => {
    // Arrange
    const consultation = { doctorId: 'd1' };

    // Act
    const act = () => assertCanEditConsultation(consultation, doctor);

    // Assert
    expect(act).not.toThrow();
  });

  it('lets an admin edit another doctor’s consultation', () => {
    // Arrange
    const admin = { id: 'a1', role: UserRole.ADMIN };

    // Act
    const act = () => assertCanEditConsultation({ doctorId: 'd1' }, admin);

    // Assert
    expect(act).not.toThrow();
  });

  it('stops a different doctor from editing', () => {
    // Arrange
    const other = { id: 'd2', role: UserRole.DOCTOR };

    // Act
    const act = () => assertCanEditConsultation({ doctorId: 'd1' }, other);

    // Assert
    expect(act).toThrow(ForbiddenException);
  });

  it('stops a nurse from editing', () => {
    // Arrange
    const nurse = { id: 'n1', role: UserRole.NURSE };

    // Act
    const act = () => assertCanEditConsultation({ doctorId: 'd1' }, nurse);

    // Assert
    expect(act).toThrow(ForbiddenException);
  });

  it('only lets an admin assign a consultation to someone else', () => {
    // Arrange
    const doctorId = 'd2';

    // Act
    const byDoctor = () => assertCanAssignDoctor(doctorId, doctor);
    const byAdmin = () =>
      assertCanAssignDoctor(doctorId, { id: 'a1', role: UserRole.ADMIN });

    // Assert
    expect(byDoctor).toThrow(ForbiddenException);
    expect(byAdmin).not.toThrow();
  });

  it('rejects a non-doctor as the assigned doctor', () => {
    // Arrange
    const receptionist = { role: UserRole.RECEPTIONIST };

    // Act
    const act = () => assertIsDoctor(receptionist);

    // Assert
    expect(act).toThrow(BadRequestException);
  });
});
