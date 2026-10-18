import { ClinicRecordKind } from '../enums/clinic-record-kind.enum';

export class ClinicRecordCreatedEvent {
  static readonly channel = 'clinic.record.created';

  constructor(
    readonly recordId: string,
    readonly kind: ClinicRecordKind,
    readonly patientId: string,
    readonly visitId: string | null,
    readonly recordedById: string,
    readonly vaccineServiceCode: string | null,
  ) {}
}
