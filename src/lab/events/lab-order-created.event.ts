export interface LabOrderCreatedItem {
  readonly itemId: string;
  readonly testName: string;
  readonly price: number;
}

export class LabOrderCreatedEvent {
  static readonly name = 'lab.order.created';
  constructor(
    public readonly orderId: string,
    public readonly patientId: string,
    public readonly orderedById: string,
    public readonly visitId: string | null,
    public readonly items: readonly LabOrderCreatedItem[],
  ) {}
}
