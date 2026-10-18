import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, LessThanOrEqual, MoreThan, Or, Repository } from 'typeorm';
import { BaseCrudService } from 'common/services/crud.service';
import { AvailabilityStatus } from 'common/enums/availability-status.enum';
import { UsersService } from 'src/users/users.service';
import { buildPeriodDates } from './build-period-dates';
import { SetAvailabilityDto } from './dto/set-availability.dto';
import { AvailabilityPeriod } from './entities/availability-period.entity';
import { AvailabilityChangedEvent } from './events/availability-changed.event';
import {
  AVAILABLE_NOW,
  ResolvedAvailability,
  resolveAvailability,
} from './resolve-availability';

const OVERVIEW_PERIODS = 50;

export interface AvailabilityOverview {
  current: ResolvedAvailability;
  periods: AvailabilityPeriod[];
}

@Injectable()
export class AvailabilityPeriodsService extends BaseCrudService<AvailabilityPeriod> {
  constructor(
    @InjectRepository(AvailabilityPeriod)
    private readonly periods: Repository<AvailabilityPeriod>,
    private readonly users: UsersService,
    private readonly events: EventEmitter2,
  ) {
    super(periods);
  }

  async statusFor(
    userIds: string[],
    now: Date = new Date(),
  ): Promise<Map<string, ResolvedAvailability>> {
    const resolved = new Map(
      userIds.map((id): [string, ResolvedAvailability] => [id, AVAILABLE_NOW]),
    );
    if (userIds.length === 0) return resolved;
    const active = await this.periods.find({
      where: {
        userId: In(userIds),
        startsAt: LessThanOrEqual(now),
        endsAt: Or(IsNull(), MoreThan(now)),
      },
    });
    const byUser = new Map<string, AvailabilityPeriod[]>();
    active.forEach((period) =>
      byUser.set(period.userId, [...(byUser.get(period.userId) ?? []), period]),
    );
    byUser.forEach((list, userId) =>
      resolved.set(userId, resolveAvailability(list, now)),
    );
    return resolved;
  }

  async overview(
    userId: string,
    now: Date = new Date(),
  ): Promise<AvailabilityOverview> {
    const [statuses, periods] = await Promise.all([
      this.statusFor([userId], now),
      this.periods.find({
        where: { userId, endsAt: Or(IsNull(), MoreThan(now)) },
        order: { startsAt: 'ASC', id: 'ASC' },
        take: OVERVIEW_PERIODS,
      }),
    ]);
    return { current: statuses.get(userId) ?? AVAILABLE_NOW, periods };
  }

  async set(
    userId: string,
    dto: SetAvailabilityDto,
    createdById: string,
  ): Promise<AvailabilityOverview> {
    await this.users.findOne(userId);
    const now = new Date();
    if (dto.status === AvailabilityStatus.AVAILABLE) {
      await this.endActivePeriods(userId, now);
    } else {
      const dates = buildPeriodDates(dto, now);
      await this.periods.save(
        this.periods.create({
          userId,
          status: dto.status,
          ...dates,
          note: dto.note?.trim() || null,
          createdById,
        }),
      );
    }
    this.events.emit(
      AvailabilityChangedEvent.channel,
      new AvailabilityChangedEvent(userId),
    );
    return this.overview(userId, now);
  }

  async cancel(
    userId: string,
    periodId: string,
  ): Promise<AvailabilityOverview> {
    const period = await this.findOneByWhere({
      where: { id: periodId, userId },
    });
    if (!period) throw new NotFoundException('Availability period not found');
    const now = new Date();
    if (period.startsAt > now) {
      await this.periods.softRemove(period);
    } else {
      period.endsAt = now;
      await this.periods.save(period);
    }
    this.events.emit(
      AvailabilityChangedEvent.channel,
      new AvailabilityChangedEvent(userId),
    );
    return this.overview(userId, now);
  }

  private async endActivePeriods(userId: string, now: Date): Promise<void> {
    const active = await this.periods.find({
      where: {
        userId,
        startsAt: LessThanOrEqual(now),
        endsAt: Or(IsNull(), MoreThan(now)),
      },
    });
    if (active.length === 0) return;
    await this.periods.save(
      active.map((period) => ({ ...period, endsAt: now })),
    );
  }
}
