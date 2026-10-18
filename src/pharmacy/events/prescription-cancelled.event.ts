export class PrescriptionCancelledEvent {
  static readonly channel = 'pharmacy.prescription.cancelled';

  constructor(readonly prescriptionId: string) {}
}
