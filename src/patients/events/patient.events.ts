import { Patient } from 'src/patients/entities/patient.entity';
import { PatientStatus } from 'src/patients/enums/patient-status.enum';
import { PatientType } from 'src/patients/enums/patient-type.enum';

export interface PatientEventData {
  readonly patientId: string;
  readonly mrn: string;
  readonly fullName: string;
  readonly status: PatientStatus;
  readonly type: PatientType;
}

export abstract class PatientEvent {
  abstract readonly channel: string;
  readonly occurredAt = new Date();

  constructor(readonly data: PatientEventData) {}
}

export class PatientCreatedEvent extends PatientEvent {
  static readonly channel = 'patient.created';
  readonly channel = PatientCreatedEvent.channel;
}

export class PatientUpdatedEvent extends PatientEvent {
  static readonly channel = 'patient.updated';
  readonly channel = PatientUpdatedEvent.channel;
}

export class PatientDeletedEvent extends PatientEvent {
  static readonly channel = 'patient.deleted';
  readonly channel = PatientDeletedEvent.channel;
}

export class PatientStatusChangedEvent extends PatientEvent {
  static readonly channel = 'patient.status_changed';
  readonly channel = PatientStatusChangedEvent.channel;

  constructor(
    data: PatientEventData,
    readonly previousStatus: PatientStatus,
  ) {
    super(data);
  }
}

export const PATIENT_EVENT_PATTERN = 'patient.*';

export function toPatientEventData(patient: Patient): PatientEventData {
  return {
    patientId: patient.id,
    mrn: patient.mrn,
    fullName: [patient.firstName, patient.middleName, patient.lastName]
      .filter(Boolean)
      .join(' '),
    status: patient.status,
    type: patient.type,
  };
}
