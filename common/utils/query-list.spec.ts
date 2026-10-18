import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Brackets, SelectQueryBuilder, WhereExpressionBuilder } from 'typeorm';
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

  it('matches a search word against name, MRN and phone', () => {
    // Arrange
    const andWhere = jest.fn<void, [Brackets]>();
    const qb = { andWhere } as unknown as SelectQueryBuilder<object>;
    const orWhere = jest.fn<void, [string]>();

    // Act
    wherePatientMatches(qb, 'patient', '0772');
    const [brackets] = andWhere.mock.calls[0];
    brackets.whereFactory({ orWhere } as unknown as WhereExpressionBuilder);

    // Assert
    expect(orWhere.mock.calls.map(([sql]) => sql)).toEqual([
      'patient.firstName ILIKE :patientTerm0',
      'patient.lastName ILIKE :patientTerm0',
      'patient.mrn ILIKE :patientTerm0',
      'patient.phone ILIKE :patientTerm0',
    ]);
  });
});
