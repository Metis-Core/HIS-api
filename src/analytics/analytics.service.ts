import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  DoctorDirectoryService,
  DoctorSummary,
} from 'src/doctors/doctor-directory.service';
import { AnalyticsRangeDto } from './analytics-range.dto';
import { DayWindow, resolveWindow } from './resolve-window';

const OPEN_STAGES = ['waiting', 'called', 'in_service'];
const ROSTER_LIMIT = 100;

interface CountRow {
  label: string;
  count: number;
}

export interface WaitRow {
  department: string;
  served: number;
  averageWaitSeconds: number;
}

export interface Overview {
  window: DayWindow;
  patients: { registered: number; total: number };
  visits: { total: number; byType: CountRow[]; byDay: CountRow[] };
  waits: WaitRow[];
  revenue: {
    total: number;
    byMethod: CountRow[];
    byDay: CountRow[];
    outstanding: number;
    openInvoices: number;
  };
  clinical: {
    consultations: number;
    labOrders: number;
    imaging: number;
    procedures: number;
    prescriptions: number;
    topDiagnoses: CountRow[];
  };
  queueNow: Array<{ department: string; status: string; count: number }>;
  doctors: DoctorSummary[];
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly doctors: DoctorDirectoryService,
  ) {}

  async overview(range: AnalyticsRangeDto): Promise<Overview> {
    const window = resolveWindow(range);
    const span: [string, string] = [window.from, window.to];
    const [patients, visits, waits, revenue, clinical, queueNow, roster] =
      await Promise.all([
        this.patients(span),
        this.visits(span),
        this.waits(span),
        this.revenue(span),
        this.clinical(span),
        this.queueNow(),
        this.doctors.search({ limit: ROSTER_LIMIT }),
      ]);
    return {
      window,
      patients,
      visits,
      waits,
      revenue,
      clinical,
      queueNow,
      doctors: roster.items,
    };
  }

  private async patients(span: [string, string]) {
    const [row] = await this.dataSource.query<
      Array<{ registered: number; total: number }>
    >(
      `SELECT COUNT(*) FILTER (WHERE "createdAt"::date BETWEEN $1 AND $2)::int AS registered,
              COUNT(*)::int AS total
       FROM patients WHERE "deletedAt" IS NULL`,
      span,
    );
    return row;
  }

  private async visits(span: [string, string]) {
    const [byType, byDay] = await Promise.all([
      this.dataSource.query<CountRow[]>(
        `SELECT "visitType"::text AS label, COUNT(*)::int AS count FROM visits
         WHERE "deletedAt" IS NULL AND "createdAt"::date BETWEEN $1 AND $2
         GROUP BY 1 ORDER BY 2 DESC`,
        span,
      ),
      this.dataSource.query<CountRow[]>(
        `SELECT "createdAt"::date::text AS label, COUNT(*)::int AS count FROM visits
         WHERE "deletedAt" IS NULL AND "createdAt"::date BETWEEN $1 AND $2
         GROUP BY 1 ORDER BY 1`,
        span,
      ),
    ]);
    return {
      total: byType.reduce((sum, row) => sum + row.count, 0),
      byType,
      byDay,
    };
  }

  private waits(span: [string, string]): Promise<WaitRow[]> {
    return this.dataSource.query<WaitRow[]>(
      `SELECT department::text AS department,
              COUNT(*)::int AS served,
              COALESCE(AVG(EXTRACT(EPOCH FROM (
                COALESCE("startedAt", "calledAt", "completedAt") - COALESCE(ready, "createdAt")
              ))), 0)::int AS "averageWaitSeconds"
       FROM (
         SELECT qe.*, LAG(qe."completedAt") OVER (PARTITION BY qe."visitId" ORDER BY qe."sequenceNumber") AS ready
         FROM queue_entries qe WHERE qe."deletedAt" IS NULL
       ) entry
       WHERE status = 'completed' AND department <> 'reception'
         AND "completedAt"::date BETWEEN $1 AND $2
       GROUP BY department ORDER BY served DESC`,
      span,
    );
  }

  private async revenue(span: [string, string]) {
    const [byMethod, byDay, [owed]] = await Promise.all([
      this.dataSource.query<CountRow[]>(
        `SELECT method::text AS label, COALESCE(SUM(amount), 0)::int AS count FROM payments
         WHERE status = 'recorded' AND "businessDate" BETWEEN $1 AND $2 GROUP BY 1 ORDER BY 2 DESC`,
        span,
      ),
      this.dataSource.query<CountRow[]>(
        `SELECT "businessDate"::text AS label, COALESCE(SUM(amount), 0)::int AS count FROM payments
         WHERE status = 'recorded' AND "businessDate" BETWEEN $1 AND $2 GROUP BY 1 ORDER BY 1`,
        span,
      ),
      this.dataSource.query<Array<{ outstanding: number; invoices: number }>>(
        `SELECT COALESCE(SUM(total - paid), 0)::int AS outstanding, COUNT(*)::int AS invoices
         FROM invoices WHERE "deletedAt" IS NULL AND total > paid`,
      ),
    ]);
    return {
      total: byMethod.reduce((sum, row) => sum + row.count, 0),
      byMethod,
      byDay,
      outstanding: owed.outstanding,
      openInvoices: owed.invoices,
    };
  }

  private async clinical(span: [string, string]) {
    const [[counts], topDiagnoses] = await Promise.all([
      this.dataSource.query<Array<Record<string, number>>>(
        `SELECT
           (SELECT COUNT(*) FROM consultations WHERE "deletedAt" IS NULL AND "createdAt"::date BETWEEN $1 AND $2)::int AS consultations,
           (SELECT COUNT(*) FROM lab_orders WHERE "deletedAt" IS NULL AND "createdAt"::date BETWEEN $1 AND $2)::int AS "labOrders",
           (SELECT COUNT(*) FROM procedure_orders WHERE "deletedAt" IS NULL AND kind = 'radiology' AND "createdAt"::date BETWEEN $1 AND $2)::int AS imaging,
           (SELECT COUNT(*) FROM procedure_orders WHERE "deletedAt" IS NULL AND kind = 'surgery' AND "createdAt"::date BETWEEN $1 AND $2)::int AS procedures,
           (SELECT COUNT(*) FROM prescriptions WHERE "deletedAt" IS NULL AND "createdAt"::date BETWEEN $1 AND $2)::int AS prescriptions`,
        span,
      ),
      this.dataSource.query<CountRow[]>(
        `SELECT code || ' ' || COALESCE(title, '') AS label, COUNT(*)::int AS count
         FROM consultation_diagnoses WHERE "deletedAt" IS NULL AND "createdAt"::date BETWEEN $1 AND $2
         GROUP BY code, title ORDER BY count DESC, code LIMIT 5`,
        span,
      ),
    ]);
    return {
      consultations: counts.consultations,
      labOrders: counts.labOrders,
      imaging: counts.imaging,
      procedures: counts.procedures,
      prescriptions: counts.prescriptions,
      topDiagnoses,
    };
  }

  private queueNow() {
    return this.dataSource.query<
      Array<{ department: string; status: string; count: number }>
    >(
      `SELECT department::text AS department, status::text AS status, COUNT(*)::int AS count
       FROM queue_entries WHERE "deletedAt" IS NULL AND status = ANY($1)
       GROUP BY 1, 2 ORDER BY 1, 2`,
      [OPEN_STAGES],
    );
  }
}
