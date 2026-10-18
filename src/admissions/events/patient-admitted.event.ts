export class PatientAdmittedEvent {
  static readonly channel = 'admission.admitted';

  constructor(
    readonly admissionId: string,
    readonly visitId: string | null,
    readonly patientId: string,
    readonly admittedById: string,
  ) {}
}
