import { ChargeSource, ChargeStatus } from './enums/charge.enum';
import { groupCharges } from './charge-groups';

const charge = (
  source: ChargeSource,
  amount: number,
  status = ChargeStatus.PENDING,
) => ({
  source,
  amount,
  status,
});

describe('groupCharges', () => {
  it('groups charges by department in billing order with subtotals', () => {
    const groups = groupCharges([
      charge(ChargeSource.LAB, 20000),
      charge(ChargeSource.CONSULTATION, 30000),
      charge(ChargeSource.LAB, 15000),
    ]);
    expect(groups.map((g) => g.source)).toEqual([
      ChargeSource.CONSULTATION,
      ChargeSource.LAB,
    ]);
    expect(groups[1].subtotal).toBe(35000);
    expect(groups[1].items).toHaveLength(2);
  });

  it('keeps waived lines visible but out of the subtotal', () => {
    const [group] = groupCharges([
      charge(ChargeSource.RADIOLOGY, 50000),
      charge(ChargeSource.RADIOLOGY, 40000, ChargeStatus.WAIVED),
    ]);
    expect(group.items).toHaveLength(2);
    expect(group.subtotal).toBe(50000);
  });

  it('omits departments with nothing billed', () => {
    expect(groupCharges([])).toEqual([]);
  });
});
