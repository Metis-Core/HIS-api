import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { SelectQueryBuilder } from 'typeorm';
import { QueryPrescriptionsDto } from 'src/pharmacy/dto/query-prescriptions.dto';
import { PrescriptionStatus } from 'src/pharmacy/enums/prescription-status.enum';
import { toList, wherePatientMatches } from './query-list';

describe('query-list helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('splits a comma-separated value and drops blanks', () => {
    // Arrange
    const value = 'PENDING, PARTIALLY_DISPENSED,,';

    // Act
    const list = toList({ value });

    // Assert
    expect(list).toEqual(['PENDING', 'PARTIALLY_DISPENSED']);
  });

  it('accepts several statuses and rejects an unknown one', async () => {
    // Arrange
    const ok = plainToInstance(QueryPrescriptionsDto, {
      status: `${PrescriptionStatus.PENDING},${PrescriptionStatus.PARTIALLY_DISPENSED}`,
    });
    const bad = plainToInstance(QueryPrescriptionsDto, {
      status: 'PENDING,LOST',
    });

    // Act
    const [okErrors, badErrors] = await Promise.all([
      validate(ok),
      validate(bad),
    ]);

    // Assert
    expect(okErrors).toHaveLength(0);
    expect(ok.status).toEqual([
      PrescriptionStatus.PENDING,
      PrescriptionStatus.PARTIALLY_DISPENSED,
    ]);
    expect(badErrors.map((e) => e.property)).toEqual(['status']);
  });

  it('adds one patient condition per search word and none for a blank search', () => {
    // Arrange
    const andWhere = jest.fn();
    const qb = { andWhere } as unknown as SelectQueryBuilder<object>;

    // Act
    wherePatientMatches(qb, 'patient', '   ');
    wherePatientMatches(qb, 'patient', 'jane nakato');

    // Assert
    expect(andWhere).toHaveBeenCalledTimes(2);
  });
});
