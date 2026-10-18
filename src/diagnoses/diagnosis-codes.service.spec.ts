import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DiagnosisCodesService } from './diagnosis-codes.service';
import { DiagnosisCode } from './entities/diagnosis-code.entity';
import { DiagnosisCodeSystem } from './enums/diagnosis-code-system.enum';

const qb = {
  andWhere: jest.fn().mockReturnThis(),
  addSelect: jest.fn().mockReturnThis(),
  setParameter: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  addOrderBy: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
};
const repo = {
  createQueryBuilder: jest.fn(() => qb),
  find: jest.fn(),
};

describe('DiagnosisCodesService', () => {
  let service: DiagnosisCodesService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DiagnosisCodesService,
        { provide: getRepositoryToken(DiagnosisCode), useValue: repo },
      ],
    }).compile();
    service = module.get(DiagnosisCodesService);
  });

  it('matches a dotted code by prefix and ranks exact codes first', async () => {
    // Arrange
    const query = { search: 'B50.9' };

    // Act
    await service.search(query);

    // Assert
    expect(qb.andWhere).toHaveBeenCalledWith(expect.any(String), {
      prefix: 'b509%',
      anywhere: '%b50.9%',
    });
    expect(qb.setParameter).toHaveBeenCalledWith('exact', 'b509');
    expect(qb.orderBy).toHaveBeenCalledWith('rank', 'ASC');
  });

  it('treats LIKE wildcards in the search as plain text', async () => {
    // Arrange
    const query = { search: '100%_' };

    // Act
    await service.search(query);

    // Assert
    expect(qb.andWhere).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ anywhere: '%100\\%\\_%' }),
    );
  });

  it('filters by system and pages in code order without a search', async () => {
    // Arrange
    const query = { system: DiagnosisCodeSystem.ICD10_CM, page: 3, limit: 10 };

    // Act
    const page = await service.search(query);

    // Assert
    expect(qb.andWhere).toHaveBeenCalledWith('dc.system = :system', {
      system: 'ICD-10-CM',
    });
    expect(qb.addOrderBy).toHaveBeenCalledWith('dc.code', 'ASC');
    expect(qb.skip).toHaveBeenCalledWith(20);
    expect(page.meta).toEqual({
      total: 0,
      page: 3,
      limit: 10,
      hasNextPage: false,
    });
  });

  it('skips the query when no ids are asked for', async () => {
    // Arrange
    const ids: string[] = [];

    // Act
    const codes = await service.findByIds(ids);

    // Assert
    expect(codes).toEqual([]);
    expect(repo.find).not.toHaveBeenCalled();
  });
});
