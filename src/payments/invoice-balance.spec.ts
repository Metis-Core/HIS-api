import { ChargeStatus } from './enums/charge.enum';
import { InvoiceStatus, PaymentStatus } from './enums/payment.enum';
import { settle } from './invoice-balance';

const charge = (amount: number, status = ChargeStatus.PENDING) => ({
  amount,
  status,
});
const payment = (amount: number, status = PaymentStatus.RECORDED) => ({
  amount,
  status,
});

describe('settle', () => {
  it('is unpaid until something is received', () => {
    expect(settle([charge(5000), charge(3000)], [])).toEqual({
      total: 8000,
      paid: 0,
      balance: 8000,
      status: InvoiceStatus.UNPAID,
    });
  });

  it('is partly paid while a balance remains', () => {
    const result = settle([charge(8000)], [payment(3000)]);
    expect(result.status).toBe(InvoiceStatus.PARTIALLY_PAID);
    expect(result.balance).toBe(5000);
  });

  it('is paid once the recorded payments cover the bill', () => {
    const result = settle([charge(8000)], [payment(3000), payment(5000)]);
    expect(result.status).toBe(InvoiceStatus.PAID);
    expect(result.balance).toBe(0);
  });

  it('ignores waived charges and voided payments', () => {
    const result = settle(
      [charge(8000), charge(2000, ChargeStatus.WAIVED)],
      [payment(8000, PaymentStatus.VOIDED), payment(1000)],
    );
    expect(result.total).toBe(8000);
    expect(result.paid).toBe(1000);
    expect(result.status).toBe(InvoiceStatus.PARTIALLY_PAID);
  });

  it('settles a bill that is only free services', () => {
    const result = settle([charge(0)], []);
    expect(result.status).toBe(InvoiceStatus.PAID);
    expect(result.total).toBe(0);
  });

  it('does not call an empty bill paid', () => {
    expect(settle([], []).status).toBe(InvoiceStatus.UNPAID);
  });
});
