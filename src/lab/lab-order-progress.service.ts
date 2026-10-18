import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, Not, Repository } from 'typeorm';
import { Department } from 'common/enums/department.enum';
import { AfterCommit } from 'common/events/after-commit';
import { QueueEntriesService } from 'src/queue/queue-entries.service';
import { LabOrderItem } from './entities/lab-order-item.entity';
import { LabOrder } from './entities/lab-order.entity';
import { LabOrderItemStatus as ItemStatus } from './enums/lab-order-item-status.enum';
import { LabOrderStatus } from './enums/lab-order-status.enum';
import { LabOrderCompletedEvent } from './events/lab-order-completed.event';
import { CRITICAL_FLAGS } from './results/result-schema.types';

const DONE = [ItemStatus.VERIFIED, ItemStatus.CANCELLED];
const OPEN_ORDER = [LabOrderStatus.PENDING, LabOrderStatus.IN_PROGRESS];

export const hasCriticalValue = (item: LabOrderItem) =>
  Object.values(item.resultFlags ?? {}).some((flag) =>
    CRITICAL_FLAGS.includes(flag),
  );

/** Moves an order along as its tests progress; it completes only once every test is verified or cancelled. */
@Injectable()
export class LabOrderProgressService {
  constructor(
    @InjectRepository(LabOrder)
    private readonly orders: Repository<LabOrder>,
    private readonly queueEntries: QueueEntriesService,
  ) {}

  async reconcile(
    manager: EntityManager,
    after: AfterCommit,
    orderId: string,
  ): Promise<boolean> {
    const order = await manager.findOneOrFail(LabOrder, {
      where: { id: orderId },
    });
    if (!OPEN_ORDER.includes(order.status)) return false;
    const items = await manager.find(LabOrderItem, { where: { orderId } });
    const verified = items.filter((i) => i.status === ItemStatus.VERIFIED);

    if (verified.length > 0 && items.every((i) => DONE.includes(i.status))) {
      order.status = LabOrderStatus.COMPLETED;
      order.completedAt = order.completedAt ?? new Date();
      await manager.save(LabOrder, order);
      after.run(() => this.releaseLabQueue(order));
      after.emit(
        LabOrderCompletedEvent.name,
        new LabOrderCompletedEvent(
          order.id,
          order.patientId,
          order.orderedById,
          verified.filter((i) => i.isAbnormal).length,
          verified.filter(hasCriticalValue).length,
        ),
      );
      return true;
    }
    if (
      order.status === LabOrderStatus.PENDING &&
      items.some((i) => i.status !== ItemStatus.PENDING)
    ) {
      order.status = LabOrderStatus.IN_PROGRESS;
      await manager.save(LabOrder, order);
    }
    return false;
  }

  // Same intent as Joel's queue-completion WIP: the lab stage closes only when no other lab order on the visit is open.
  private async releaseLabQueue(order: LabOrder): Promise<void> {
    if (!order.visitId) return;
    const otherOpen = await this.orders.count({
      where: {
        visitId: order.visitId,
        id: Not(order.id),
        status: In(OPEN_ORDER),
      },
    });
    if (otherOpen === 0) {
      await this.queueEntries.completeCurrentFor(
        order.visitId,
        Department.MAIN_LABORATORY,
      );
    }
  }
}
