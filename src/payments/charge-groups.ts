import { ChargeSource, ChargeStatus } from './enums/charge.enum';

export const CHARGE_SOURCE_LABEL: Record<ChargeSource, string> = {
  [ChargeSource.CONSULTATION]: 'Consultation',
  [ChargeSource.LAB]: 'Laboratory',
  [ChargeSource.RADIOLOGY]: 'Radiology',
  [ChargeSource.SURGERY]: 'Surgery and procedures',
  [ChargeSource.SERVICE]: 'Services',
  [ChargeSource.PHARMACY]: 'Pharmacy',
  [ChargeSource.OTHER]: 'Other charges',
};

const GROUP_ORDER: readonly ChargeSource[] = [
  ChargeSource.CONSULTATION,
  ChargeSource.LAB,
  ChargeSource.RADIOLOGY,
  ChargeSource.SURGERY,
  ChargeSource.PHARMACY,
  ChargeSource.SERVICE,
  ChargeSource.OTHER,
];

interface GroupableCharge {
  source: ChargeSource;
  amount: number;
  status: ChargeStatus;
}

export interface ChargeGroup<T extends GroupableCharge> {
  source: ChargeSource;
  label: string;
  subtotal: number;
  items: T[];
}

export function groupCharges<T extends GroupableCharge>(
  charges: readonly T[],
): ChargeGroup<T>[] {
  return GROUP_ORDER.map((source) => {
    const items = charges.filter((charge) => charge.source === source);
    const subtotal = items
      .filter((charge) => charge.status !== ChargeStatus.WAIVED)
      .reduce((sum, charge) => sum + charge.amount, 0);
    return { source, label: CHARGE_SOURCE_LABEL[source], subtotal, items };
  }).filter((group) => group.items.length > 0);
}
