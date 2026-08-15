import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IPagination } from 'common/response-format';
import { BaseCrudService } from '../../common/services/crud.service';
import { CreateServiceDTO } from './dto/create-service.dto';
import { QueryServicesDTO } from './dto/query-services.dto';
import { UpdateServiceDTO } from './dto/update-service.dto';
import { Service } from './entities/service.entity';

@Injectable()
export class ServicesService extends BaseCrudService<Service> {
  constructor(
    @InjectRepository(Service)
    private readonly servicesRepository: Repository<Service>,
  ) {
    super(servicesRepository);
  }

  override async create(entity: CreateServiceDTO): Promise<Service> {
    const existing = await this.servicesRepository.findOne({
      where: { name: entity.name },
    });
    if (existing) {
      throw new ConflictException('A service with this name already exists');
    }
    return super.create(entity);
  }

  async findAllPaginated(
    query: QueryServicesDTO,
  ): Promise<IPagination<Service>> {
    const { page = 1, limit = 20, sortOrder = 'ASC' } = query;
    const qb = this.servicesRepository.createQueryBuilder('service');

    if (query.search) {
      qb.andWhere('LOWER(service.name) LIKE :search', {
        search: `%${query.search.toLowerCase()}%`,
      });
    }
    if (query.isActive !== undefined) {
      qb.andWhere('service.isActive = :isActive', { isActive: query.isActive });
    }

    const [items, total] = await qb
      .orderBy('service.name', sortOrder)
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { items, total };
  }

  override async update(id: string, dto: UpdateServiceDTO): Promise<Service> {
    if (dto.name) {
      const existing = await this.servicesRepository.findOne({
        where: { name: dto.name },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException('A service with this name already exists');
      }
    }
    return super.update(id, dto);
  }
}
