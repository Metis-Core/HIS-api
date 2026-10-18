import { BadRequestException } from '@nestjs/common';
import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import { whereDayRange } from './date-range';

const makeQb = () => {
  const qb = { andWhere: jest.fn() };
  qb.andWhere.mockReturnValue(qb);
  return qb;
};

describe('whereDayRange', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('includes the whole of the last day', () => {
    // Arrange
    const qb = makeQb();

    // Act
    whereDayRange(
      qb as unknown as SelectQueryBuilder<ObjectLiteral>,
      'item.createdAt',
      {
        from: '2026-10-01',
        to: '2026-10-18',
      },
    );

    // Assert
    expect(qb.andWhere).toHaveBeenCalledWith(
      'item.createdAt >= CAST(:rangeFrom AS date)',
      {
        rangeFrom: '2026-10-01',
      },
    );
    expect(qb.andWhere).toHaveBeenCalledWith(
      'item.createdAt < CAST(:rangeTo AS date) + 1',
      {
        rangeTo: '2026-10-18',
      },
    );
  });

  it('adds nothing without a range', () => {
    // Arrange
    const qb = makeQb();

    // Act
    whereDayRange(
      qb as unknown as SelectQueryBuilder<ObjectLiteral>,
      'item.createdAt',
      {},
    );

    // Assert
    expect(qb.andWhere).not.toHaveBeenCalled();
  });

  it('rejects a range that ends before it starts', () => {
    // Arrange
    const qb = makeQb();

    // Act
    const apply = () =>
      whereDayRange(qb as unknown as SelectQueryBuilder<ObjectLiteral>, 'x', {
        from: '2026-10-18',
        to: '2026-10-01',
      });

    // Assert
    expect(apply).toThrow(BadRequestException);
  });
});
