export enum PaymentMethod {
  CASH = 'cash',
  MOBILE_MONEY = 'mobile_money',
  CARD = 'card',
  INSURANCE = 'insurance',
}

export enum PaymentStatus {
  RECORDED = 'recorded',
  VOIDED = 'voided',
}

export enum InvoiceStatus {
  UNPAID = 'unpaid',
  PARTIALLY_PAID = 'partially_paid',
  PAID = 'paid',
}

export const REFERENCE_REQUIRED: readonly PaymentMethod[] = [
  PaymentMethod.MOBILE_MONEY,
  PaymentMethod.CARD,
  PaymentMethod.INSURANCE,
];
