import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, In, Repository } from 'typeorm';
import { BaseCrudService } from 'common/services/crud.service';
import { CatalogueFilterDTO } from 'common/dto/catalogue-filter.dto';
import { MAX_PAGE_SIZE } from 'common/pagination';
import { IPagination } from 'common/response-format';
import { CreateInventoryStoreDto } from './dto/create-inventory-store.dto';
import { UpdateInventoryStoreDto } from './dto/update-inventory-store.dto';
import { InventoryStore } from './entities/inventory-store.entity';
import {
  assertStoreInScope,
  FULL_INVENTORY_SCOPE,
  InventoryScope,
} from './inventory-scope.policy';

const storeWhere = (scope: InventoryScope): FindOptionsWhere<InventoryStore> =>
  scope.departments ? { department: In([...scope.departments]) } : {};

@Injectable()
export class InventoryStoresService extends BaseCrudService<InventoryStore> {
  constructor(
    @InjectRepository(InventoryStore)
    private readonly storesRepository: Repository<InventoryStore>,
  ) {
    super(storesRepository);
  }

  override async create(dto: CreateInventoryStoreDto): Promise<InventoryStore> {
    const existing = await this.storesRepository.findOne({
      where: { name: dto.name },
    });
    if (existing) {
      throw new ConflictException('A store with this name already exists');
    }
    return super.create(dto);
  }

  override async update(
    id: string,
    dto: UpdateInventoryStoreDto,
  ): Promise<InventoryStore> {
    if (dto.name) {
      const existing = await this.storesRepository.findOne({
        where: { name: dto.name },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException('A store with this name already exists');
      }
    }
    return super.update(id, dto);
  }

  async findVisible(
    id: string,
    scope: InventoryScope,
  ): Promise<InventoryStore> {
    const store = await this.findOne(id);
    assertStoreInScope(scope, store);
    return store;
  }

  async search(
    query: CatalogueFilterDTO,
    scope: InventoryScope = FULL_INVENTORY_SCOPE,
  ): Promise<IPagination<InventoryStore>> {
    return this.findPage(
      {
        where: storeWhere(scope),
        order: { name: query.sortOrder ?? 'ASC', id: 'ASC' },
      },
      query,
    );
  }

  // Physical stores are a handful; the cap only guards the picker against runaway data.
  async listActive(
    scope: InventoryScope = FULL_INVENTORY_SCOPE,
  ): Promise<InventoryStore[]> {
    return this.storesRepository.find({
      where: { isActive: true, ...storeWhere(scope) },
      order: { name: 'ASC' },
      take: MAX_PAGE_SIZE,
    });
  }
}
