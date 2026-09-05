export class LabOrderCompletedEvent {
  static readonly name = 'lab.order.completed';
  constructor(
    public readonly orderId: string,
    public readonly patientId: string,
    public readonly orderedById: string,
  ) {}
}
