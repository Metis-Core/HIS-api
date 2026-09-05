export class PrescriptionDispensedEvent {
  static readonly name = 'pharmacy.prescription.dispensed';
  constructor(
    public readonly prescriptionId: string,
    public readonly patientId: string,
    public readonly dispensedById: string,
  ) {}
}
