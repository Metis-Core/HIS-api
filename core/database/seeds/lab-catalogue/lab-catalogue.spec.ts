import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { LabResultSchemaDTO } from 'src/lab/dto/lab-result-schema.dto';
import { assertValidSchema } from 'src/lab/results/validate-schema';
import { LAB_CATALOGUE } from './index';

describe('LAB_CATALOGUE', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('has unique, upper-case codes that the test DTO accepts', () => {
    // Arrange
    const codes = LAB_CATALOGUE.map((t) => t.code);

    // Act
    const unique = new Set(codes);

    // Assert
    expect(unique.size).toBe(codes.length);
    codes.forEach((code) => expect(code).toMatch(/^[A-Z0-9_-]+$/));
  });

  it('ships every template the client asked for', () => {
    // Arrange
    const required = ['URINALYSIS', 'CBC', 'BS', 'STOOL'];

    // Act
    const present = required.filter((code) =>
      LAB_CATALOGUE.some((t) => t.code === code && t.fields.length > 3),
    );

    // Assert
    expect(present).toEqual(required);
  });

  it.each(LAB_CATALOGUE.map((t) => [t.code, t] as const))(
    '%s has a template that passes API validation',
    (_code, test) => {
      // Arrange
      const dto = plainToInstance(LabResultSchemaDTO, { fields: test.fields });

      // Act
      const errors = validateSync(dto, {
        whitelist: true,
        forbidNonWhitelisted: true,
      });

      // Assert
      expect(errors).toEqual([]);
      expect(() => assertValidSchema({ fields: test.fields })).not.toThrow();
    },
  );
});
