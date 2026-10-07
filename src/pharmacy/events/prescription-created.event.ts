export class PrescriptionCreatedEvent {
  static readonly name = 'pharmacy.prescription.created';
  constructor(
    public readonly prescriptionId: string,
    public readonly patientId: string,
    public readonly prescribedById: string,
    public readonly itemCount: number,
  ) {}
}
