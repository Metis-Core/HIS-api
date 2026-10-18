import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { LabOrderItem } from '../entities/lab-order-item.entity';
import { AgeBand } from './age-band';
import { LabReportsService } from './lab-reports.service';

const qb = {
  innerJoin: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  addSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  groupBy: jest.fn().mockReturnThis(),
  addGroupBy: jest.fn().mockReturnThis(),
  getRawMany: jest.fn(),
};
const items = { createQueryBuilder: jest.fn(() => qb) };
const raw = (
  testName: string,
  gender: string,
  ageBand: AgeBand | null,
  total = '1',
) => ({
  testId: testName,
  testCode: testName.slice(0, 3).toUpperCase(),
  testName,
  gender,
  ageBand,
  total,
  abnormal: '0',
  critical: '0',
});

describe('LabReportsService', () => {
  let service: LabReportsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        LabReportsService,
        { provide: getRepositoryToken(LabOrderItem), useValue: items },
      ],
    }).compile();
    service = module.get(LabReportsService);
  });

  it('orders groups by test, sex and age band from youngest, unknown age last', async () => {
    // Arrange
    qb.getRawMany.mockResolvedValue([
      raw('Malaria', 'male', AgeBand.AGE_60_PLUS),
      raw('Malaria', 'male', null),
      raw('Haemoglobin', 'female', AgeBand.AGE_18_59),
      raw('Malaria', 'male', AgeBand.UNDER_5),
      raw('Malaria', 'female', AgeBand.AGE_5_12),
    ]);

    // Act
    const rows = await service.rows({});

    // Assert
    expect(rows.map((r) => `${r.testName}/${r.gender}/${r.ageBand}`)).toEqual([
      'Haemoglobin/female/18_59',
      'Malaria/female/5_12',
      'Malaria/male/under_5',
      'Malaria/male/60_plus',
      'Malaria/male/null',
    ]);
  });

  it('pages the groups with the standard meta and numeric counts', async () => {
    // Arrange
    qb.getRawMany.mockResolvedValue([
      raw('A', 'male', AgeBand.UNDER_5, '4'),
      raw('B', 'male', AgeBand.UNDER_5),
      raw('C', 'male', AgeBand.UNDER_5),
    ]);

    // Act
    const page = await service.summary({ page: 2, limit: 2 });

    // Assert
    expect(page.items.map((r) => r.testName)).toEqual(['C']);
    expect(page.meta).toMatchObject({ total: 3, page: 2, hasNextPage: false });
  });

  it('counts only verified results', async () => {
    // Arrange
    qb.getRawMany.mockResolvedValue([]);

    // Act
    await service.rows({ gender: undefined });

    // Assert
    expect(qb.where).toHaveBeenCalledWith('item.status = :verified', {
      verified: 'verified',
    });
  });
});
