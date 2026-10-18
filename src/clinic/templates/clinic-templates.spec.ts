import { assertValidSchema } from 'src/lab/results/validate-schema';
import { ClinicRecordKind } from '../enums/clinic-record-kind.enum';
import { NATIONAL_VACCINES, PRIVATE_VACCINES, VACCINES } from '../vaccines';
import { CLINIC_TEMPLATES } from './index';

describe('clinic templates', () => {
  it.each(Object.values(ClinicRecordKind))(
    '%s is a valid template with unique keys',
    (kind) => {
      const { fields } = CLINIC_TEMPLATES[kind];
      expect(() => assertValidSchema({ fields })).not.toThrow();
      const keys = fields.map((f) => f.key);
      expect(new Set(keys).size).toBe(keys.length);
      expect(fields.some((f) => f.required)).toBe(true);
    },
  );

  it('offers every vaccine in the immunization form, with a dose and a route that exist', () => {
    const vaccineField = CLINIC_TEMPLATES[
      ClinicRecordKind.IMMUNIZATION
    ].fields.find((f) => f.key === 'vaccine');
    const dose = CLINIC_TEMPLATES[ClinicRecordKind.IMMUNIZATION].fields.find(
      (f) => f.key === 'dose',
    );
    const route = CLINIC_TEMPLATES[ClinicRecordKind.IMMUNIZATION].fields.find(
      (f) => f.key === 'route',
    );
    expect(vaccineField?.options).toEqual(VACCINES.map((v) => v.name));
    VACCINES.forEach((vaccine) => {
      expect(route?.options).toContain(vaccine.route);
      vaccine.doses.forEach((d) => expect(dose?.options).toContain(d));
    });
  });

  it('keeps vaccine names unique and prices only the private ones', () => {
    const names = VACCINES.map((v) => v.name);
    expect(new Set(names).size).toBe(names.length);
    NATIONAL_VACCINES.forEach((v) => expect(v.serviceCode).toBeUndefined());
    PRIVATE_VACCINES.forEach((v) =>
      expect(v.serviceCode).toMatch(/^VAC_[A-Z0-9_]+$/),
    );
  });
});
