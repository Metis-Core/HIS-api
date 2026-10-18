import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IPagination } from 'common/response-format';
import { pageWindow, toPage } from 'common/pagination';
import { BaseCrudService } from '../../common/services/crud.service';
import { CreateServiceDTO } from './dto/create-service.dto';
import { QueryServicesDTO } from './dto/query-services.dto';
import { UpdateServiceDTO } from './dto/update-service.dto';
import { Service } from './entities/service.entity';
import { ServiceCode } from './service-codes';

@Injectable()
export class ServicesService extends BaseCrudService<Service> {
  private readonly logger = new Logger(ServicesService.name);

  constructor(
    @InjectRepository(Service)
    private readonly servicesRepository: Repository<Service>,
  ) {
    super(servicesRepository);
  }

  override async create(entity: CreateServiceDTO): Promise<Service> {
    await this.assertUnique(entity.name, entity.code);
    return super.create(entity);
  }

  private async assertUnique(
    name?: string,
    code?: string,
    excludeId?: string,
  ): Promise<void> {
    if (name) {
      const byName = await this.servicesRepository.findOne({ where: { name } });
      if (byName && byName.id !== excludeId) {
        throw new ConflictException('A service with this name already exists');
      }
    }
    if (code) {
      const byCode = await this.servicesRepository.findOne({ where: { code } });
      if (byCode && byCode.id !== excludeId) {
        throw new ConflictException('A service with this code already exists');
      }
    }
  }

  async findAllPaginated(
    query: QueryServicesDTO,
  ): Promise<IPagination<Service>> {
    const window = pageWindow(query);
    const sortOrder = query.sortOrder ?? 'ASC';
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
      .addOrderBy('service.id', sortOrder)
      .skip(window.skip)
      .take(window.take)
      .getManyAndCount();

    return toPage(items, total, window);
  }

  async findConsultationService(): Promise<Service | null> {
    const byCode = await this.servicesRepository.findOne({
      where: { code: ServiceCode.CONSULTATION, isActive: true },
    });
    if (byCode) return byCode;
    const byName = await this.findConsultationServiceByName();
    if (byName) {
      // Legacy fallback for databases where no service carries the code yet.
      this.logger.warn(
        `No active service has code ${ServiceCode.CONSULTATION}; using "${byName.name}" matched by name`,
      );
    }
    return byName;
  }

  private findConsultationServiceByName(): Promise<Service | null> {
    return this.servicesRepository
      .createQueryBuilder('service')
      .where('service.isActive = true')
      .andWhere('LOWER(service.name) LIKE :name', { name: 'consultation%' })
      .orderBy('service.name', 'ASC')
      .getOne();
  }

  override async update(id: string, dto: UpdateServiceDTO): Promise<Service> {
    await this.assertUnique(dto.name, dto.code, id);
    return super.update(id, dto);
  }
}
