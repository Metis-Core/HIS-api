import { ChargeStatus } from './enums/charge.enum';
import { InvoiceStatus, PaymentStatus } from './enums/payment.enum';

export interface Settlement {
  total: number;
  paid: number;
  balance: number;
  status: InvoiceStatus;
}

export function settle(
  charges: ReadonlyArray<{ amount: number; status: ChargeStatus }>,
  payments: ReadonlyArray<{ amount: number; status: PaymentStatus }>,
): Settlement {
  const total = charges
    .filter((charge) => charge.status !== ChargeStatus.WAIVED)
    .reduce((sum, charge) => sum + charge.amount, 0);
  const paid = payments
    .filter((payment) => payment.status === PaymentStatus.RECORDED)
    .reduce((sum, payment) => sum + payment.amount, 0);
  const balance = Math.max(total - paid, 0);
  const status =
    total > 0 && balance === 0
      ? InvoiceStatus.PAID
      : paid > 0
        ? InvoiceStatus.PARTIALLY_PAID
        : InvoiceStatus.UNPAID;
  return { total, paid, balance, status };
}
