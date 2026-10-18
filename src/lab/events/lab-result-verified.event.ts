export class LabResultVerifiedEvent {
  static readonly name = 'lab.result.verified';
  constructor(
    public readonly orderId: string,
    public readonly itemId: string,
    public readonly patientId: string,
    public readonly orderedById: string,
    public readonly testName: string,
    public readonly flagged: boolean,
    public readonly critical: boolean,
    public readonly amended = false,
  ) {}
}
