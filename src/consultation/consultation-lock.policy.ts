import { BadRequestException, ConflictException } from '@nestjs/common';
import { ConsultationStatus } from './enums/consultation-status.enum';

type WithStatus = { status: ConsultationStatus };

// M-10: a signed encounter is a legal record; later information goes into an addendum.
export function assertOpenForEditing({ status }: WithStatus): void {
  if (status === ConsultationStatus.COMPLETED) {
    throw new ConflictException(
      'This consultation is signed and locked. Add an addendum instead.',
    );
  }
  if (status === ConsultationStatus.CANCELLED) {
    throw new BadRequestException('Cancelled consultation cannot be edited');
  }
}

export function assertCanAddAddendum({ status }: WithStatus): void {
  if (status === ConsultationStatus.COMPLETED) return;
  throw new BadRequestException(
    'Addenda are for signed consultations. Edit the encounter until it is signed.',
  );
}
