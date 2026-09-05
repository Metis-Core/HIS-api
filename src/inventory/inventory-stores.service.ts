import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseCrudService } from 'common/services/crud.service';
import { CreateInventoryStoreDto } from './dto/create-inventory-store.dto';
import { UpdateInventoryStoreDto } from './dto/update-inventory-store.dto';
import { InventoryStore } from './entities/inventory-store.entity';

@Injectable()
export class InventoryStoresService extends BaseCrudService<InventoryStore> {
  constructor(
    @InjectRepository(InventoryStore)
    private readonly storesRepository: Repository<InventoryStore>,
  ) {
    super(storesRepository);
  }

  override async create(dto: CreateInventoryStoreDto): Promise<InventoryStore> {
    const existing = await this.storesRepository.findOne({ where: { name: dto.name } });
    if (existing) {
      throw new ConflictException('A store with this name already exists');
    }
    return super.create(dto);
  }

  override async update(id: string, dto: UpdateInventoryStoreDto): Promise<InventoryStore> {
    if (dto.name) {
      const existing = await this.storesRepository.findOne({ where: { name: dto.name } });
      if (existing && existing.id !== id) {
        throw new ConflictException('A store with this name already exists');
      }
    }
    return super.update(id, dto);
  }

  async listActive(): Promise<InventoryStore[]> {
    return this.storesRepository.find({ where: { isActive: true }, order: { name: 'ASC' } });
  }
}
