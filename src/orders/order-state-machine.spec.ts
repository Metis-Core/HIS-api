import { BadRequestException } from '@nestjs/common';
import { OrderStatus } from './enums/order-status.enum';
import { assertOrderTransition } from './order-state-machine';

describe('assertOrderTransition', () => {
  it('lets an order move forward', () => {
    expect(() =>
      assertOrderTransition(OrderStatus.REQUESTED, OrderStatus.SCHEDULED),
    ).not.toThrow();
    expect(() =>
      assertOrderTransition(OrderStatus.SCHEDULED, OrderStatus.IN_PROGRESS),
    ).not.toThrow();
    expect(() =>
      assertOrderTransition(OrderStatus.IN_PROGRESS, OrderStatus.COMPLETED),
    ).not.toThrow();
  });

  it('allows cancelling before the work is finished', () => {
    expect(() =>
      assertOrderTransition(OrderStatus.REQUESTED, OrderStatus.CANCELLED),
    ).not.toThrow();
    expect(() =>
      assertOrderTransition(OrderStatus.IN_PROGRESS, OrderStatus.CANCELLED),
    ).not.toThrow();
  });

  it('refuses to skip the work or reopen a closed order', () => {
    expect(() =>
      assertOrderTransition(OrderStatus.REQUESTED, OrderStatus.COMPLETED),
    ).toThrow(BadRequestException);
    expect(() =>
      assertOrderTransition(OrderStatus.COMPLETED, OrderStatus.CANCELLED),
    ).toThrow(BadRequestException);
    expect(() =>
      assertOrderTransition(OrderStatus.CANCELLED, OrderStatus.REQUESTED),
    ).toThrow(BadRequestException);
  });
});
