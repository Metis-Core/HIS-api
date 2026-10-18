import { plainToInstance } from 'class-transformer';
import { QueryServicesDTO } from './query-services.dto';

describe('QueryServicesDTO', () => {
  it.each([
    ['true', true],
    ['false', false],
    [undefined, undefined],
  ])('reads isActive=%s as %s', (raw, expected) => {
    // Act
    const query = plainToInstance(
      QueryServicesDTO,
      { isActive: raw },
      { enableImplicitConversion: true },
    );

    // Assert
    expect(query.isActive).toBe(expected);
  });
});
