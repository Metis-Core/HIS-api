import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { pageWindow, toPage } from 'common/pagination';
import { IPagination } from 'common/response-format';
import { DayRange, whereDayRange } from 'common/utils/date-range';
import { wherePatientMatches } from 'common/utils/query-list';
import { QueryLabItemsDto } from './dto/query-lab-items.dto';
import { LabOrderItem } from './entities/lab-order-item.entity';
import { LabOrderItemStatus } from './enums/lab-order-item-status.enum';

export type LabBoardSummary = Record<LabOrderItemStatus, number>;

/** C1: where every sample is (collected, in progress, awaiting verification, verified) and who handled it. */
@Injectable()
export class LabBoardService {
  constructor(
    @InjectRepository(LabOrderItem)
    private readonly items: Repository<LabOrderItem>,
  ) {}

  async search(query: QueryLabItemsDto): Promise<IPagination<LabOrderItem>> {
    const window = pageWindow(query);
    const sortOrder = query.sortOrder ?? 'DESC';
    const qb = this.items
      .createQueryBuilder('item')
      .innerJoinAndSelect('item.order', 'order')
      .innerJoinAndSelect('order.patient', 'patient')
      .innerJoinAndSelect('item.test', 'test')
      .leftJoinAndSelect('item.collectedBy', 'collectedBy')
      .leftJoinAndSelect('item.resultedBy', 'resultedBy')
      .leftJoinAndSelect('item.verifiedBy', 'verifiedBy');
    if (query.status?.length) {
      qb.andWhere('item.status IN (:...statuses)', { statuses: query.status });
    }
    if (query.testId) {
      qb.andWhere('item.testId = :testId', { testId: query.testId });
    }
    wherePatientMatches(qb, 'patient', query.search);
    whereDayRange(qb, 'item.createdAt', query);
    const [rows, total] = await qb
      .orderBy('item.createdAt', sortOrder)
      .addOrderBy('item.id', sortOrder)
      .skip(window.skip)
      .take(window.take)
      .getManyAndCount();
    return toPage(rows, total, window);
  }

  /** Column counts for the board header; every status is present, zero when empty. */
  async summary(range: DayRange): Promise<LabBoardSummary> {
    const qb = this.items
      .createQueryBuilder('item')
      .select('item.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('item.status');
    whereDayRange(qb, 'item.createdAt', range);
    const rows = await qb.getRawMany<{
      status: LabOrderItemStatus;
      count: string;
    }>();
    const summary = Object.fromEntries(
      Object.values(LabOrderItemStatus).map((status) => [status, 0]),
    ) as LabBoardSummary;
    rows.forEach((row) => (summary[row.status] = Number(row.count)));
    return summary;
  }
}
