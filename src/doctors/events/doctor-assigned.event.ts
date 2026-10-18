export class DoctorAssignedEvent {
  static readonly channel = 'doctor.assigned';

  constructor(
    readonly visitId: string,
    readonly doctorId: string,
    readonly previousDoctorId: string | null,
    /** The patient asked for this doctor by name. */
    readonly requested: boolean = false,
  ) {}
}
