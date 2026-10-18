import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DataSource, EntityManager } from 'typeorm';
import { Department } from 'common/enums/department.enum';
import { AfterCommit, commitThenEmit } from 'common/events/after-commit';
import { QueueEntriesService } from 'src/queue/queue-entries.service';
import { UpdateLabOrderItemDto } from './dto/update-lab-order-item.dto';
import { LabOrderItem } from './entities/lab-order-item.entity';
import { LabOrder } from './entities/lab-order.entity';
import { LabOrderItemStatus } from './enums/lab-order-item-status.enum';
import { LabOrderStatus } from './enums/lab-order-status.enum';
import { LabOrderCompletedEvent } from './events/lab-order-completed.event';
import { LabResultReadyEvent } from './events/lab-result-ready.event';
import { LabOrdersService } from './lab-orders.service';

const IN_PROGRESS = [
  LabOrderItemStatus.COLLECTED,
  LabOrderItemStatus.IN_PROCESS,
];
const TERMINAL = [
  LabOrderItemStatus.RESULT_READY,
  LabOrderItemStatus.CANCELLED,
];

/** Result entry on lab order items and the order status that follows from it. */
@Injectable()
export class LabResultsService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly labOrders: LabOrdersService,
    private readonly eventEmitter: EventEmitter2,
    private readonly queueEntries: QueueEntriesService,
  ) {}

  async updateItem(
    orderId: string,
    itemId: string,
    dto: UpdateLabOrderItemDto,
    resultedById: string,
  ): Promise<LabOrder> {
    await commitThenEmit(
      this.dataSource,
      this.eventEmitter,
      async (manager, after) => {
        const item = await manager.findOne(LabOrderItem, {
          where: { id: itemId, orderId },
          relations: { test: true },
        });
        if (!item) throw new NotFoundException('Lab order item not found');

        if (dto.status !== undefined) item.status = dto.status;
        if (dto.resultValue !== undefined)
          item.resultValue = dto.resultValue?.trim() || null;
        if (dto.resultNotes !== undefined)
          item.resultNotes = dto.resultNotes?.trim() || null;
        if (dto.isAbnormal !== undefined) item.isAbnormal = dto.isAbnormal;
        if (dto.status === LabOrderItemStatus.COLLECTED && !item.collectedAt) {
          item.collectedAt = new Date();
        }
        if (dto.status === LabOrderItemStatus.RESULT_READY) {
          item.resultedAt = new Date();
          item.resultedById = resultedById;
        }
        await manager.save(item);

        const order = await this.reconcileOrderStatus(manager, after, orderId);
        // A fully completed order is announced by LabOrderCompletedEvent instead.
        if (
          dto.status === LabOrderItemStatus.RESULT_READY &&
          order.status !== LabOrderStatus.COMPLETED
        ) {
          after.emit(
            LabResultReadyEvent.name,
            new LabResultReadyEvent(
              order.id,
              item.id,
              order.patientId,
              order.orderedById,
              item.test?.name ?? 'Lab test',
              item.isAbnormal,
            ),
          );
        }
      },
    );
    return this.labOrders.findOne(orderId);
  }

  private async reconcileOrderStatus(
    manager: EntityManager,
    after: AfterCommit,
    orderId: string,
  ): Promise<LabOrder> {
    const order = await manager.findOneOrFail(LabOrder, {
      where: { id: orderId },
    });
    if (order.status === LabOrderStatus.CANCELLED) return order;
    const items = await manager.find(LabOrderItem, { where: { orderId } });

    const allTerminal = items.every((i) => TERMINAL.includes(i.status));
    const anyReady = items.some(
      (i) => i.status === LabOrderItemStatus.RESULT_READY,
    );
    if (allTerminal && anyReady) {
      order.status = LabOrderStatus.COMPLETED;
      order.completedAt = order.completedAt ?? new Date();
      await manager.save(order);
      const visitId = order.visitId;
      if (visitId) {
        after.run(() =>
          this.queueEntries.completeCurrentFor(
            visitId,
            Department.MAIN_LABORATORY,
          ),
        );
      }
      after.emit(
        LabOrderCompletedEvent.name,
        new LabOrderCompletedEvent(
          order.id,
          order.patientId,
          order.orderedById,
          items.filter((i) => i.isAbnormal).length,
        ),
      );
    } else if (
      items.some((i) => IN_PROGRESS.includes(i.status)) &&
      order.status === LabOrderStatus.PENDING
    ) {
      order.status = LabOrderStatus.IN_PROGRESS;
      await manager.save(order);
    }
    return order;
  }
}
