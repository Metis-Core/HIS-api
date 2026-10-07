export class LabOrderCancelledEvent {
  static readonly name = 'lab.order.cancelled';
  constructor(
    public readonly orderId: string,
    public readonly patientId: string,
    public readonly orderedById: string,
  ) {}
}
