import { BadRequestException } from '@nestjs/common';
import { OrderStatus } from './enums/order-status.enum';

const TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  [OrderStatus.REQUESTED]: [
    OrderStatus.SCHEDULED,
    OrderStatus.IN_PROGRESS,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.SCHEDULED]: [OrderStatus.IN_PROGRESS, OrderStatus.CANCELLED],
  [OrderStatus.IN_PROGRESS]: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
  [OrderStatus.COMPLETED]: [],
  [OrderStatus.CANCELLED]: [],
};

export const OPEN_ORDER_STATUSES: readonly OrderStatus[] = [
  OrderStatus.REQUESTED,
  OrderStatus.SCHEDULED,
  OrderStatus.IN_PROGRESS,
];

export function assertOrderTransition(
  from: OrderStatus,
  to: OrderStatus,
): void {
  if (!TRANSITIONS[from].includes(to)) {
    throw new BadRequestException(
      `An order that is ${from.replaceAll('_', ' ')} cannot become ${to.replaceAll('_', ' ')}`,
    );
  }
}
