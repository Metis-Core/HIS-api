import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseCrudService } from 'common/services/crud.service';
import { IPagination } from 'common/response-format';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { QueryInventoryItemsDto } from './dto/query-inventory-items.dto';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto';
import { InventoryItem } from './entities/inventory-item.entity';

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
      throw new ConflictException('An inventory item with this SKU already exists');
    }
    return super.create({ ...dto, sku });
  }

  async search(query: QueryInventoryItemsDto): Promise<IPagination<InventoryItem>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const sortOrder = query.sortOrder ?? 'ASC';

    const qb = this.itemsRepository.createQueryBuilder('item');
    if (query.type) qb.andWhere('item.type = :type', { type: query.type });
    if (query.isActive !== undefined) qb.andWhere('item.isActive = :isActive', { isActive: query.isActive });
    if (query.search?.trim()) {
      const term = `%${query.search.trim().toLowerCase()}%`;
      qb.andWhere('(LOWER(item.name) LIKE :term OR LOWER(item.sku) LIKE :term)', { term });
    }

    const [items, total] = await qb
      .orderBy('item.name', sortOrder)
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { items, total };
  }

  override async update(id: string, dto: UpdateInventoryItemDto): Promise<InventoryItem> {
    if (dto.sku) {
      const sku = dto.sku.trim().toUpperCase();
      const existing = await this.itemsRepository.findOne({ where: { sku } });
      if (existing && existing.id !== id) {
        throw new ConflictException('An inventory item with this SKU already exists');
      }
      return super.update(id, { ...dto, sku });
    }
    return super.update(id, dto);
  }
}
