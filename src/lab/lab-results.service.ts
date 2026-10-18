import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from 'common/enums/department.enum';
import { QueueEntriesService } from 'src/queue/queue-entries.service';
import { UpdateLabOrderItemDto } from './dto/update-lab-order-item.dto';
import { LabOrderItem } from './entities/lab-order-item.entity';
import { LabOrder } from './entities/lab-order.entity';
import { LabOrderItemStatus } from './enums/lab-order-item-status.enum';
import { LabOrderStatus } from './enums/lab-order-status.enum';
import { LabOrderCompletedEvent } from './events/lab-order-completed.event';
import { LabResultReadyEvent } from './events/lab-result-ready.event';
import { LabOrdersService } from './lab-orders.service';

/** Result entry on lab order items and the order status that follows from it. */
@Injectable()
export class LabResultsService {
  constructor(
    @InjectRepository(LabOrder)
    private readonly labOrdersRepository: Repository<LabOrder>,
    @InjectRepository(LabOrderItem)
    private readonly labOrderItemsRepository: Repository<LabOrderItem>,
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
    const item = await this.labOrderItemsRepository.findOne({
      where: { id: itemId, orderId },
    });
    if (!item) {
      throw new NotFoundException('Lab order item not found');
    }

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

    await this.labOrderItemsRepository.save(item);
    await this.reconcileOrderStatus(orderId);
    const order = await this.labOrders.findOne(orderId);

    // A fully completed order is announced by LabOrderCompletedEvent instead.
    if (
      dto.status === LabOrderItemStatus.RESULT_READY &&
      order.status !== LabOrderStatus.COMPLETED
    ) {
      this.eventEmitter.emit(
        LabResultReadyEvent.name,
        new LabResultReadyEvent(
          order.id,
          item.id,
          order.patientId,
          order.orderedById,
          order.items.find((i) => i.id === item.id)?.test?.name ?? 'Lab test',
          item.isAbnormal,
        ),
      );
    }
    return order;
  }

  private async reconcileOrderStatus(orderId: string): Promise<void> {
    const items = await this.labOrderItemsRepository.find({
      where: { orderId },
    });
    const order = await this.labOrdersRepository.findOneOrFail({
      where: { id: orderId },
    });

    if (order.status === LabOrderStatus.CANCELLED) return;

    const anyInProgress = items.some((i) =>
      [LabOrderItemStatus.COLLECTED, LabOrderItemStatus.IN_PROCESS].includes(
        i.status,
      ),
    );
    const allTerminal = items.every((i) =>
      [LabOrderItemStatus.RESULT_READY, LabOrderItemStatus.CANCELLED].includes(
        i.status,
      ),
    );
    const anyReady = items.some(
      (i) => i.status === LabOrderItemStatus.RESULT_READY,
    );

    if (allTerminal && anyReady) {
      order.status = LabOrderStatus.COMPLETED;
      order.completedAt = order.completedAt ?? new Date();
      await this.labOrdersRepository.save(order);
      if (order.visitId) {
        await this.queueEntries.completeCurrentFor(
          order.visitId,
          Department.MAIN_LABORATORY,
        );
      }
      this.eventEmitter.emit(
        LabOrderCompletedEvent.name,
        new LabOrderCompletedEvent(
          order.id,
          order.patientId,
          order.orderedById,
          items.filter((i) => i.isAbnormal).length,
        ),
      );
    } else if (anyInProgress && order.status === LabOrderStatus.PENDING) {
      order.status = LabOrderStatus.IN_PROGRESS;
      await this.labOrdersRepository.save(order);
    }
  }
}
