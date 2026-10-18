import { dailyNumberPrefix, nextDailyNumber } from './daily-number';

describe('nextDailyNumber', () => {
  it('starts each day at 001', () => {
    expect(nextDailyNumber('INV', '2026-10-18', null)).toBe('INV-20261018-001');
    expect(nextDailyNumber('INV', '2026-10-18', 'INV-20261017-044')).toBe(
      'INV-20261018-001',
    );
  });

  it('continues after the last number issued today', () => {
    expect(nextDailyNumber('RCP', '2026-10-18', 'RCP-20261018-009')).toBe(
      'RCP-20261018-010',
    );
  });

  it('builds a prefix for lookups', () => {
    expect(dailyNumberPrefix('RCP', '2026-10-18')).toBe('RCP-20261018-');
  });
});
