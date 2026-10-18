export class DoctorRequestUnavailableEvent {
  static readonly channel = 'doctor.request.unavailable';

  constructor(
    readonly visitId: string,
    readonly requestedDoctorId: string,
    readonly checkedInById: string,
    readonly assignedDoctorId: string | null,
  ) {}
}
