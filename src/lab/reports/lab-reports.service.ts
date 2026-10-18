import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Gender } from 'common/enums/gender.enum';
import { pageWindow, toPage } from 'common/pagination';
import { IPagination } from 'common/response-format';
import { whereDayRange } from 'common/utils/date-range';
import { LabOrderItem } from '../entities/lab-order-item.entity';
import { LabOrderItemStatus } from '../enums/lab-order-item-status.enum';
import { AGE_BAND_ORDER, AGE_BAND_SQL, AgeBand } from './age-band';
import { QueryLabReportDto } from './query-lab-report.dto';

export interface LabReportRow {
  testId: string;
  testCode: string;
  testName: string;
  gender: Gender;
  ageBand: AgeBand | null;
  total: number;
  abnormal: number;
  critical: number;
}

interface RawRow extends Omit<LabReportRow, 'total' | 'abnormal' | 'critical'> {
  total: string;
  abnormal: string;
  critical: string;
}

const CRITICAL_SQL = `EXISTS (SELECT 1 FROM jsonb_each_text(COALESCE(item."resultFlags", '{}'::jsonb)) f WHERE f.value IN ('critical_low', 'critical_high'))`;

/** L11: counts of verified results by test, sex and age band (one row per non-empty group). */
@Injectable()
export class LabReportsService {
  constructor(
    @InjectRepository(LabOrderItem)
    private readonly items: Repository<LabOrderItem>,
  ) {}

  async summary(query: QueryLabReportDto): Promise<IPagination<LabReportRow>> {
    const rows = await this.rows(query);
    const window = pageWindow(query);
    return toPage(
      rows.slice(window.skip, window.skip + window.take),
      rows.length,
      window,
    );
  }

  // Groups are bounded (tests x sexes x bands), so the whole set is built and then paged or exported.
  async rows(query: QueryLabReportDto): Promise<LabReportRow[]> {
    const qb = this.items
      .createQueryBuilder('item')
      .innerJoin('item.order', 'order')
      .innerJoin('order.patient', 'patient')
      .innerJoin('item.test', 'test')
      .select('test.id', 'testId')
      .addSelect('test.code', 'testCode')
      .addSelect('test.name', 'testName')
      .addSelect('patient.gender', 'gender')
      .addSelect(AGE_BAND_SQL, 'ageBand')
      .addSelect('COUNT(*)', 'total')
      .addSelect('COUNT(*) FILTER (WHERE item.isAbnormal)', 'abnormal')
      .addSelect(`COUNT(*) FILTER (WHERE ${CRITICAL_SQL})`, 'critical')
      .where('item.status = :verified', {
        verified: LabOrderItemStatus.VERIFIED,
      })
      .groupBy('test.id')
      .addGroupBy('test.code')
      .addGroupBy('test.name')
      .addGroupBy('patient.gender')
      .addGroupBy('"ageBand"');
    whereDayRange(qb, 'item.verifiedAt', query);
    if (query.gender)
      qb.andWhere('patient.gender = :gender', { gender: query.gender });
    if (query.test) qb.andWhere('test.id = :testId', { testId: query.test });
    if (query.ageBand)
      qb.andWhere(`${AGE_BAND_SQL} = :ageBand`, { ageBand: query.ageBand });
    const raw = await qb.getRawMany<RawRow>();
    return raw.map(toRow).sort(byReportOrder);
  }
}

const toRow = (raw: RawRow): LabReportRow => ({
  ...raw,
  total: Number(raw.total),
  abnormal: Number(raw.abnormal),
  critical: Number(raw.critical),
});

const bandIndex = (band: AgeBand | null) =>
  band ? AGE_BAND_ORDER.indexOf(band) : AGE_BAND_ORDER.length;

const byReportOrder = (a: LabReportRow, b: LabReportRow) =>
  a.testName.localeCompare(b.testName) ||
  a.gender.localeCompare(b.gender) ||
  bandIndex(a.ageBand) - bandIndex(b.ageBand);
