import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Repository } from 'typeorm';
import { BaseFilterDTO } from '../dto/filter.dto';
import { CatalogueFilterDTO } from '../dto/catalogue-filter.dto';
import { BaseEntity } from '../entities/base.entity';
import { BaseCrudService } from '../services/crud.service';
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  pageWindow,
  PaginationQueryDTO,
  toPage,
} from './pagination';

class TestCrudService extends BaseCrudService<BaseEntity> {}

describe('pagination', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('pageWindow', () => {
    it('defaults to the first page of DEFAULT_PAGE_SIZE rows', () => {
      // Arrange / Act
      const window = pageWindow();

      // Assert
      expect(window).toEqual({
        page: 1,
        limit: DEFAULT_PAGE_SIZE,
        skip: 0,
        take: DEFAULT_PAGE_SIZE,
      });
    });

    it('clamps an oversized limit and a non-positive page', () => {
      // Arrange
      const query = { page: 0, limit: 5000 };

      // Act
      const window = pageWindow(query);

      // Assert
      expect(window).toEqual({
        page: 1,
        limit: MAX_PAGE_SIZE,
        skip: 0,
        take: MAX_PAGE_SIZE,
      });
    });

    it('turns page 3 of 25 into skip 50', () => {
      // Arrange / Act
      const window = pageWindow({ page: 3, limit: 25 });

      // Assert
      expect(window.skip).toBe(50);
      expect(window.take).toBe(25);
    });
  });

  describe('toPage', () => {
    it('reports hasNextPage while rows remain', () => {
      // Arrange
      const window = pageWindow({ page: 1, limit: 2 });

      // Act
      const page = toPage(['a', 'b'], 5, window);

      // Assert
      expect(page).toEqual({
        items: ['a', 'b'],
        total: 5,
        meta: { total: 5, page: 1, limit: 2, hasNextPage: true },
      });
    });

    it('reports no next page on the last page', () => {
      // Arrange
      const window = pageWindow({ page: 3, limit: 2 });

      // Act
      const page = toPage(['e'], 5, window);

      // Assert
      expect(page.meta).toEqual({
        total: 5,
        page: 3,
        limit: 2,
        hasNextPage: false,
      });
    });
  });

  describe('query DTOs', () => {
    it('rejects a limit above MAX_PAGE_SIZE', async () => {
      // Arrange
      const dto = plainToInstance(PaginationQueryDTO, {
        limit: String(MAX_PAGE_SIZE + 1),
      });

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.map((e) => e.property)).toEqual(['limit']);
    });

    it('sorts chronological lists newest first and catalogues A→Z by default', () => {
      // Arrange / Act
      const chronological = plainToInstance(BaseFilterDTO, {});
      const catalogue = plainToInstance(CatalogueFilterDTO, {});

      // Assert
      expect(chronological.sortOrder).toBe('DESC');
      expect(catalogue.sortOrder).toBe('ASC');
      expect(chronological.limit).toBe(DEFAULT_PAGE_SIZE);
    });
  });

  describe('BaseCrudService.findPage', () => {
    it('passes a clamped window to the repository and wraps the result', async () => {
      // Arrange
      const findAndCount = jest.fn().mockResolvedValue([[{ id: '1' }], 41]);
      const service = new TestCrudService({
        findAndCount,
      } as unknown as Repository<BaseEntity>);

      // Act
      const page = await service.findPage(
        { order: { id: 'DESC' } },
        { page: 2, limit: 500 },
      );

      // Assert
      expect(findAndCount).toHaveBeenCalledWith({
        order: { id: 'DESC' },
        skip: 100,
        take: 100,
      });
      expect(page.meta).toEqual({
        total: 41,
        page: 2,
        limit: 100,
        hasNextPage: false,
      });
    });
  });
});
