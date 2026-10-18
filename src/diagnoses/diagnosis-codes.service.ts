import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { pageWindow, toPage } from 'common/pagination';
import { IPagination } from 'common/response-format';
import { BaseCrudService } from 'common/services/crud.service';
import { QueryDiagnosisCodesDTO } from './dto/query-diagnosis-codes.dto';
import { DiagnosisCode } from './entities/diagnosis-code.entity';

// LIKE wildcards in the search box are matched literally.
const escapeLike = (term: string): string => term.replace(/[\\%_]/g, '\\$&');

@Injectable()
export class DiagnosisCodesService extends BaseCrudService<DiagnosisCode> {
  constructor(
    @InjectRepository(DiagnosisCode)
    private readonly codes: Repository<DiagnosisCode>,
  ) {
    super(codes);
  }

  /** Codes matching the search, best match first: exact code, code prefix, then title words. */
  async search(
    query: QueryDiagnosisCodesDTO,
  ): Promise<IPagination<DiagnosisCode>> {
    const window = pageWindow(query);
    const qb = this.codes.createQueryBuilder('dc');
    if (query.system)
      qb.andWhere('dc.system = :system', { system: query.system });
    const term = query.search?.trim().toLowerCase();
    if (term) {
      const like = escapeLike(term.replace(/\./g, ''));
      qb.andWhere(
        `(REPLACE(LOWER(dc.code), '.', '') LIKE :prefix OR LOWER(dc.title) LIKE :anywhere)`,
        { prefix: `${like}%`, anywhere: `%${escapeLike(term)}%` },
      )
        .addSelect(
          `CASE WHEN REPLACE(LOWER(dc.code), '.', '') = :exact THEN 0 WHEN REPLACE(LOWER(dc.code), '.', '') LIKE :prefix THEN 1 ELSE 2 END`,
          'rank',
        )
        .setParameter('exact', term.replace(/\./g, ''))
        .orderBy('rank', 'ASC');
    }
    qb.addOrderBy('dc.code', 'ASC').skip(window.skip).take(window.take);
    const [items, total] = await qb.getManyAndCount();
    return toPage(items, total, window);
  }

  async findByIds(ids: string[]): Promise<DiagnosisCode[]> {
    if (ids.length === 0) return [];
    return this.codes.find({ where: { id: In(ids) } });
  }
}
