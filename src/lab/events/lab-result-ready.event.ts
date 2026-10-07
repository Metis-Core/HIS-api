export class LabResultReadyEvent {
  static readonly name = 'lab.result.ready';
  constructor(
    public readonly orderId: string,
    public readonly itemId: string,
    public readonly patientId: string,
    public readonly orderedById: string,
    public readonly testName: string,
    public readonly isAbnormal: boolean,
  ) {}
}
