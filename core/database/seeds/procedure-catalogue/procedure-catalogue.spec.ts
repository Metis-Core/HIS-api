import { assertValidSchema } from 'src/lab/results/validate-schema';
import { IMAGING_AND_PROCEDURE_CATALOGUE } from './index';

describe('imaging and procedure catalogue', () => {
  it('has unique codes and names', () => {
    const codes = IMAGING_AND_PROCEDURE_CATALOGUE.map((t) => t.code);
    const names = IMAGING_AND_PROCEDURE_CATALOGUE.map((t) =>
      t.name.toLowerCase(),
    );
    expect(new Set(codes).size).toBe(codes.length);
    expect(new Set(names).size).toBe(names.length);
  });

  it('gives every entry a valid result template and a price', () => {
    IMAGING_AND_PROCEDURE_CATALOGUE.forEach((test) => {
      expect(test.fields.length).toBeGreaterThan(0);
      expect(test.price).toBeGreaterThan(0);
      expect(() => assertValidSchema({ fields: test.fields })).not.toThrow();
    });
  });

  it('keeps field keys unique within a template and marks at least one required', () => {
    IMAGING_AND_PROCEDURE_CATALOGUE.forEach((test) => {
      const keys = test.fields.map((f) => f.key);
      expect(new Set(keys).size).toBe(keys.length);
      expect(test.fields.some((f) => f.required)).toBe(true);
    });
  });
});
