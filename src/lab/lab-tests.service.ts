import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseCrudService } from 'common/services/crud.service';
import { IPagination } from 'common/response-format';
import { CreateLabTestDto } from './dto/create-lab-test.dto';
import { QueryLabTestsDto } from './dto/query-lab-tests.dto';
import { UpdateLabTestDto } from './dto/update-lab-test.dto';
import { LabTest } from './entities/lab-test.entity';
import { pageWindow, toPage } from 'common/pagination';
import { assertValidSchema } from './results/validate-schema';

@Injectable()
export class LabTestsService extends BaseCrudService<LabTest> {
  constructor(
    @InjectRepository(LabTest)
    private readonly labTestsRepository: Repository<LabTest>,
  ) {
    super(labTestsRepository);
  }

  override async create(dto: CreateLabTestDto): Promise<LabTest> {
    assertValidSchema(dto.resultSchema);
    const code = dto.code.trim().toUpperCase();
    const existing = await this.labTestsRepository.findOne({ where: { code } });
    if (existing) {
      throw new ConflictException('A lab test with this code already exists');
    }
    return super.create({ ...dto, code });
  }

  async search(query: QueryLabTestsDto): Promise<IPagination<LabTest>> {
    const window = pageWindow(query);
    const sortOrder = query.sortOrder ?? 'ASC';

    const qb = this.labTestsRepository.createQueryBuilder('test');
    if (query.category)
      qb.andWhere('test.category = :category', { category: query.category });
    if (query.sampleType)
      qb.andWhere('test.sampleType = :sampleType', {
        sampleType: query.sampleType,
      });
    if (query.isActive !== undefined)
      qb.andWhere('test.isActive = :isActive', { isActive: query.isActive });
    if (query.search?.trim()) {
      const term = `%${query.search.trim().toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(test.name) LIKE :term OR LOWER(test.code) LIKE :term)',
        { term },
      );
    }

    const [items, total] = await qb
      .orderBy('test.name', sortOrder)
      // Tie-break on id so rows never repeat or vanish between pages.
      .addOrderBy('test.id', sortOrder)
      .skip(window.skip)
      .take(window.take)
      .getManyAndCount();

    return toPage(items, total, window);
  }

  override async update(id: string, dto: UpdateLabTestDto): Promise<LabTest> {
    assertValidSchema(dto.resultSchema);
    if (dto.code) {
      const code = dto.code.trim().toUpperCase();
      const existing = await this.labTestsRepository.findOne({
        where: { code },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException('A lab test with this code already exists');
      }
      return super.update(id, { ...dto, code });
    }
    return super.update(id, dto);
  }
}
