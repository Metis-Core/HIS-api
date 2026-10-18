import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseCrudService } from 'common/services/crud.service';
import { IPagination } from 'common/response-format';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { QueryInventoryItemsDto } from './dto/query-inventory-items.dto';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto';
import { InventoryItem } from './entities/inventory-item.entity';
import { pageWindow, toPage } from 'common/pagination';
import {
  assertItemInScope,
  FULL_INVENTORY_SCOPE,
  InventoryScope,
  scopeItems,
} from './inventory-scope.policy';

@Injectable()
export class InventoryItemsService extends BaseCrudService<InventoryItem> {
  constructor(
    @InjectRepository(InventoryItem)
    private readonly itemsRepository: Repository<InventoryItem>,
  ) {
    super(itemsRepository);
  }

  override async create(dto: CreateInventoryItemDto): Promise<InventoryItem> {
    const sku = dto.sku.trim().toUpperCase();
    const existing = await this.itemsRepository.findOne({ where: { sku } });
    if (existing) {
      throw new ConflictException(
        'An inventory item with this SKU already exists',
      );
    }
    return super.create({ ...dto, sku });
  }

  async findVisible(id: string, scope: InventoryScope): Promise<InventoryItem> {
    const item = await this.findOne(id);
    assertItemInScope(scope, item);
    return item;
  }

  async search(
    query: QueryInventoryItemsDto,
    scope: InventoryScope = FULL_INVENTORY_SCOPE,
  ): Promise<IPagination<InventoryItem>> {
    const window = pageWindow(query);
    const sortOrder = query.sortOrder ?? 'ASC';

    const qb = this.itemsRepository.createQueryBuilder('item');
    scopeItems(qb, 'item', scope);
    if (query.type) qb.andWhere('item.type = :type', { type: query.type });
    if (query.isActive !== undefined)
      qb.andWhere('item.isActive = :isActive', { isActive: query.isActive });
    if (query.search?.trim()) {
      const term = `%${query.search.trim().toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(item.name) LIKE :term OR LOWER(item.sku) LIKE :term)',
        { term },
      );
    }

    const [items, total] = await qb
      .orderBy('item.name', sortOrder)
      // Tie-break on id so rows never repeat or vanish between pages.
      .addOrderBy('item.id', sortOrder)
      .skip(window.skip)
      .take(window.take)
      .getManyAndCount();

    return toPage(items, total, window);
  }

  override async update(
    id: string,
    dto: UpdateInventoryItemDto,
  ): Promise<InventoryItem> {
    if (dto.sku) {
      const sku = dto.sku.trim().toUpperCase();
      const existing = await this.itemsRepository.findOne({ where: { sku } });
      if (existing && existing.id !== id) {
        throw new ConflictException(
          'An inventory item with this SKU already exists',
        );
      }
      return super.update(id, { ...dto, sku });
    }
    return super.update(id, dto);
  }
}
