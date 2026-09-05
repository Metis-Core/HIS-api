export class LabOrderCreatedEvent {
  static readonly name = 'lab.order.created';
  constructor(
    public readonly orderId: string,
    public readonly patientId: string,
    public readonly orderedById: string,
  ) {}
}
