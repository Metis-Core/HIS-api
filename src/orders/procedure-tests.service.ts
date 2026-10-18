import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseCrudService } from 'common/services/crud.service';
import { IPagination } from 'common/response-format';
import { pageWindow, toPage } from 'common/pagination';
import { containsPattern } from 'common/utils/like-pattern';
import { assertValidSchema } from 'src/lab/results/validate-schema';
import {
  CreateProcedureTestDto,
  UpdateProcedureTestDto,
} from './dto/procedure-test.dto';
import { QueryProcedureTestsDto } from './dto/query-procedure-tests.dto';
import { ProcedureTest } from './entities/procedure-test.entity';

@Injectable()
export class ProcedureTestsService extends BaseCrudService<ProcedureTest> {
  constructor(
    @InjectRepository(ProcedureTest)
    private readonly tests: Repository<ProcedureTest>,
  ) {
    super(tests);
  }

  override async create(dto: CreateProcedureTestDto): Promise<ProcedureTest> {
    assertValidSchema(dto.resultSchema);
    const code = dto.code.trim().toUpperCase();
    if (await this.tests.exists({ where: { code } })) {
      throw new ConflictException('A test with this code already exists');
    }
    return super.create({ ...dto, code });
  }

  async edit(id: string, dto: UpdateProcedureTestDto): Promise<ProcedureTest> {
    assertValidSchema(dto.resultSchema);
    return super.update(id, dto);
  }

  async search(
    query: QueryProcedureTestsDto,
  ): Promise<IPagination<ProcedureTest>> {
    const window = pageWindow(query);
    const sortOrder = query.sortOrder ?? 'ASC';
    const qb = this.tests.createQueryBuilder('test');
    if (query.kind) qb.andWhere('test.kind = :kind', { kind: query.kind });
    if (query.category)
      qb.andWhere('test.category = :category', { category: query.category });
    if (query.isActive !== undefined) {
      qb.andWhere('test.isActive = :isActive', { isActive: query.isActive });
    }
    if (query.search?.trim()) {
      qb.andWhere(
        '(test.name ILIKE :term OR test.code ILIKE :term OR test.abbreviation ILIKE :term)',
        { term: containsPattern(query.search.trim()) },
      );
    }
    const [items, total] = await qb
      .orderBy('test.name', sortOrder)
      .addOrderBy('test.id', sortOrder)
      .skip(window.skip)
      .take(window.take)
      .getManyAndCount();
    return toPage(items, total, window);
  }
}
