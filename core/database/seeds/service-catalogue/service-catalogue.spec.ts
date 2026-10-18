import { SERVICE_CODE_PATTERN, ServiceCode } from 'src/services/service-codes';
import { SERVICE_CATALOGUE } from './index';

describe('service catalogue', () => {
  it('has unique names and codes, and valid codes', () => {
    const names = SERVICE_CATALOGUE.map((s) => s.name.toLowerCase());
    const codes = SERVICE_CATALOGUE.flatMap((s) => (s.code ? [s.code] : []));
    expect(new Set(names).size).toBe(names.length);
    expect(new Set(codes).size).toBe(codes.length);
    codes.forEach((code) => expect(code).toMatch(SERVICE_CODE_PATTERN));
  });

  it('covers every code the billing listener looks up', () => {
    const codes = SERVICE_CATALOGUE.map((s) => s.code);
    Object.values(ServiceCode).forEach((code) => expect(codes).toContain(code));
  });

  it('keeps immunization and antenatal visits free', () => {
    const byCode = (code: string) =>
      SERVICE_CATALOGUE.find((s) => s.code === code);
    expect(byCode(ServiceCode.IMMUNIZATION)?.fee).toBe(0);
    expect(byCode(ServiceCode.ANTENATAL_VISIT)?.fee).toBe(0);
    expect(byCode(ServiceCode.CONSULTATION)?.fee).toBeGreaterThan(0);
  });
});
