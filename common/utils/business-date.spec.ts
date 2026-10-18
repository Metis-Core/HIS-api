import { businessDateOf, isBusinessDate } from './business-date';

describe('businessDateOf', () => {
  it('uses the Kampala calendar day, not UTC', () => {
    expect(businessDateOf(new Date('2026-10-18T22:30:00Z'))).toBe('2026-10-19');
    expect(businessDateOf(new Date('2026-10-18T20:59:00Z'))).toBe('2026-10-18');
  });
});

describe('isBusinessDate', () => {
  it('accepts real dates only', () => {
    expect(isBusinessDate('2026-10-18')).toBe(true);
    expect(isBusinessDate('2026-13-40')).toBe(false);
    expect(isBusinessDate('18/10/2026')).toBe(false);
  });
});
