import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { BaseCrudService } from 'common/services/crud.service';
import { IPagination } from 'common/response-format';
import { PaginationQueryDTO } from 'common/pagination';
import { businessDateOf, isBusinessDate } from 'common/utils/business-date';
import { CloseDayDto } from './dto/close-day.dto';
import { DayClosing } from './entities/day-closing.entity';
import { Payment } from './entities/payment.entity';
import { PaymentMethod, PaymentStatus } from './enums/payment.enum';

export interface CashierTotal {
  userId: string;
  username: string;
  count: number;
  total: number;
}

export interface DaySummary {
  businessDate: string;
  closed: boolean;
  totals: Record<PaymentMethod, number>;
  expectedCash: number;
  paymentCount: number;
  voidedCount: number;
  byCashier: CashierTotal[];
}

const emptyTotals = (): Record<PaymentMethod, number> => ({
  [PaymentMethod.CASH]: 0,
  [PaymentMethod.MOBILE_MONEY]: 0,
  [PaymentMethod.CARD]: 0,
  [PaymentMethod.INSURANCE]: 0,
});

@Injectable()
export class DayClosingService extends BaseCrudService<DayClosing> {
  constructor(
    @InjectRepository(DayClosing)
    private readonly closings: Repository<DayClosing>,
    @InjectRepository(Payment)
    private readonly payments: Repository<Payment>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {
    super(closings);
  }

  async preview(date?: string): Promise<DaySummary> {
    const businessDate = date ?? businessDateOf(new Date());
    const [rows, closing] = await Promise.all([
      this.payments.find({
        where: { businessDate },
        relations: { receivedBy: true },
      }),
      this.closings.findOne({ where: { businessDate } }),
    ]);
    return { ...this.summarise(businessDate, rows), closed: Boolean(closing) };
  }

  async close(dto: CloseDayDto, closedById: string): Promise<DayClosing> {
    if (dto.date > businessDateOf(new Date())) {
      throw new BadRequestException(
        'A day that has not happened yet cannot be closed',
      );
    }
    return this.dataSource.transaction(async (manager) => {
      const taken = await manager.exists(DayClosing, {
        where: { businessDate: dto.date },
      });
      if (taken)
        throw new ConflictException('This day has already been closed out');
      const rows = await manager.find(Payment, {
        where: { businessDate: dto.date },
        relations: { receivedBy: true },
      });
      const summary = this.summarise(dto.date, rows);
      const closing = await manager.save(
        manager.create(DayClosing, {
          businessDate: dto.date,
          closedById,
          closedAt: new Date(),
          totals: summary.totals,
          expectedCash: summary.expectedCash,
          countedCash: dto.countedCash ?? null,
          variance:
            dto.countedCash === undefined
              ? null
              : dto.countedCash - summary.expectedCash,
          paymentCount: summary.paymentCount,
          voidedCount: summary.voidedCount,
          notes: dto.notes?.trim() || null,
        }),
      );
      await manager.update(
        Payment,
        { businessDate: dto.date },
        { closingId: closing.id },
      );
      return closing;
    });
  }

  async reopen(date: string): Promise<void> {
    if (!isBusinessDate(date))
      throw new BadRequestException('date must be YYYY-MM-DD');
    await this.dataSource.transaction(async (manager) => {
      const closing = await manager.findOne(DayClosing, {
        where: { businessDate: date },
      });
      if (!closing) throw new NotFoundException('That day has not been closed');
      await manager.update(
        Payment,
        { closingId: closing.id },
        { closingId: null },
      );
      await manager.remove(closing);
    });
  }

  async list(query: PaginationQueryDTO): Promise<IPagination<DayClosing>> {
    return this.findPage(
      {
        relations: { closedBy: true },
        order: { businessDate: 'DESC' },
      },
      query,
    );
  }

  private summarise(
    businessDate: string,
    rows: Payment[],
  ): Omit<DaySummary, 'closed'> {
    const totals = emptyTotals();
    const cashiers = new Map<string, CashierTotal>();
    const recorded = rows.filter(
      (row) => row.status === PaymentStatus.RECORDED,
    );
    recorded.forEach((row) => {
      totals[row.method] += row.amount;
      const entry = cashiers.get(row.receivedById) ?? {
        userId: row.receivedById,
        username: row.receivedBy?.username ?? 'Unknown',
        count: 0,
        total: 0,
      };
      entry.count += 1;
      entry.total += row.amount;
      cashiers.set(row.receivedById, entry);
    });
    return {
      businessDate,
      totals,
      expectedCash: totals[PaymentMethod.CASH],
      paymentCount: recorded.length,
      voidedCount: rows.length - recorded.length,
      byCashier: [...cashiers.values()].sort((a, b) => b.total - a.total),
    };
  }
}
