import { MEDICATION_CATALOGUE } from './index';

describe('medication catalogue', () => {
  it('has unique SKUs and names that pass the inventory SKU rule', () => {
    const skus = MEDICATION_CATALOGUE.map((m) => m.sku);
    const names = MEDICATION_CATALOGUE.map((m) => m.name.toLowerCase());
    expect(new Set(skus).size).toBe(skus.length);
    expect(new Set(names).size).toBe(names.length);
    skus.forEach((sku) => expect(sku).toMatch(/^[A-Z0-9_-]{1,64}$/));
  });

  it('prices every medication and keeps the reorder level a whole number of units', () => {
    MEDICATION_CATALOGUE.forEach((m) => {
      expect(m.unitPrice).toBeGreaterThan(0);
      expect(m.packSize).toBeGreaterThanOrEqual(1);
      expect(Number.isInteger(m.minStockLevel)).toBe(true);
      expect(m.name.length).toBeLessThanOrEqual(150);
    });
  });
});
