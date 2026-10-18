import { OrderKind } from '../enums/order-kind.enum';

export class ProcedureOrderedEvent {
  static readonly channel = 'procedure.ordered';

  constructor(
    readonly orderId: string,
    readonly visitId: string | null,
    readonly kind: OrderKind,
    readonly name: string,
    readonly price: number,
    readonly orderedById: string,
  ) {}
}

export class ProcedureCancelledEvent {
  static readonly channel = 'procedure.cancelled';

  constructor(readonly orderId: string) {}
}
