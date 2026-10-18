import { EntityManager } from 'typeorm';
import { findActiveVisit } from './journey/active-visit';

const qb = {
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  addOrderBy: jest.fn().mockReturnThis(),
  getOne: jest.fn(),
};
const manager = { createQueryBuilder: jest.fn(() => qb) };

describe('findActiveVisit', () => {
  beforeEach(() => jest.clearAllMocks());

  it('counts an undischarged admission as an active visit', async () => {
    // Arrange
    qb.getOne.mockResolvedValue({ id: 'v1' });

    // Act
    const visit = await findActiveVisit(
      manager as unknown as EntityManager,
      'p1',
    );

    // Assert
    expect(visit).toEqual({ id: 'v1' });
    const clause = qb.andWhere.mock.calls
      .map(([sql]: [string]) => sql)
      .find((sql: string) => sql.includes('"admissions"'));
    expect(clause).toContain('"dischargedAt" IS NULL');
    expect(clause).toContain('"queue_entries"');
  });
});
