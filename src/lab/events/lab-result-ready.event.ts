/** A result was entered and now awaits verification; it is not yet shown to the doctor as final. */
export class LabResultReadyEvent {
  static readonly name = 'lab.result.ready';
  constructor(
    public readonly orderId: string,
    public readonly itemId: string,
    public readonly patientId: string,
    public readonly resultedById: string,
    public readonly testName: string,
  ) {}
}
