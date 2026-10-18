export class DoctorAssignedEvent {
  static readonly channel = 'doctor.assigned';

  constructor(
    readonly visitId: string,
    readonly doctorId: string,
    readonly previousDoctorId: string | null,
  ) {}
}
