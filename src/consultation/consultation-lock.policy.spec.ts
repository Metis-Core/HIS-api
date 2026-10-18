import { BadRequestException, ConflictException } from '@nestjs/common';
import {
  assertCanAddAddendum,
  assertOpenForEditing,
} from './consultation-lock.policy';
import { ConsultationStatus } from './enums/consultation-status.enum';

describe('consultation lock policy', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('allows editing while the encounter is in progress', () => {
    // Arrange
    const consultation = { status: ConsultationStatus.IN_PROGRESS };

    // Act
    const act = () => assertOpenForEditing(consultation);

    // Assert
    expect(act).not.toThrow();
  });

  it('locks a signed encounter', () => {
    // Arrange
    const consultation = { status: ConsultationStatus.COMPLETED };

    // Act
    const act = () => assertOpenForEditing(consultation);

    // Assert
    expect(act).toThrow(ConflictException);
  });

  it('refuses edits to a cancelled encounter', () => {
    // Arrange
    const consultation = { status: ConsultationStatus.CANCELLED };

    // Act
    const act = () => assertOpenForEditing(consultation);

    // Assert
    expect(act).toThrow(BadRequestException);
  });

  it('only takes addenda on signed encounters', () => {
    // Arrange
    const open = { status: ConsultationStatus.IN_PROGRESS };
    const signed = { status: ConsultationStatus.COMPLETED };

    // Act
    const onOpen = () => assertCanAddAddendum(open);
    const onSigned = () => assertCanAddAddendum(signed);

    // Assert
    expect(onOpen).toThrow(BadRequestException);
    expect(onSigned).not.toThrow();
  });
});
