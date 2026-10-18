export class LabOrderCompletedEvent {
  static readonly name = 'lab.order.completed';
  constructor(
    public readonly orderId: string,
    public readonly patientId: string,
    public readonly orderedById: string,
    public readonly abnormalCount = 0,
    public readonly criticalCount = 0,
  ) {}
}
