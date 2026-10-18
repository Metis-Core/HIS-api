import { VisitIntenentsEnum } from '../enums/visit-type.enum';

export class VisitCheckedInEvent {
  static readonly channel = 'visit.checked_in';

  constructor(
    readonly visitId: string,
    readonly patientId: string,
    readonly checkedInById: string,
    /** The stages booked at check-in; a lab-only visit has no consultation to bill. */
    readonly intents: readonly VisitIntenentsEnum[],
    /** A doctor the patient asked for by name. */
    readonly preferredDoctorId: string | null = null,
  ) {}
}
