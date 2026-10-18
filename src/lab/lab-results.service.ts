import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DataSource, EntityManager } from 'typeorm';
import { commitThenEmit } from 'common/events/after-commit';
import { AmendLabResultDTO } from './dto/amend-lab-result.dto';
import { UpdateLabOrderItemDto } from './dto/update-lab-order-item.dto';
import { LabOrderItem } from './entities/lab-order-item.entity';
import { LabOrder } from './entities/lab-order.entity';
import { LabResultAmendment } from './entities/lab-result-amendment.entity';
import { LabOrderItemStatus as S } from './enums/lab-order-item-status.enum';
import { LabResultReadyEvent } from './events/lab-result-ready.event';
import { LabResultVerifiedEvent } from './events/lab-result-verified.event';
import {
  hasCriticalValue,
  LabOrderProgressService,
} from './lab-order-progress.service';
import { LabOrdersService } from './lab-orders.service';
import { applyResultData } from './results/apply-result';
import { assertEditable, assertTransition } from './results/item-transitions';
import { patientContext } from './results/patient-context';

const verifiedEvent = (item: LabOrderItem, amended = false) =>
  new LabResultVerifiedEvent(
    item.orderId,
    item.id,
    item.order.patientId,
    item.order.orderedById,
    item.test?.name ?? 'Lab test',
    item.isAbnormal,
    hasCriticalValue(item),
    amended,
  );

/** Result entry, verification and amendment of single tests on a lab order (L5, H-10). */
@Injectable()
export class LabResultsService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly labOrders: LabOrdersService,
    private readonly progress: LabOrderProgressService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async updateItem(
    orderId: string,
    itemId: string,
    dto: UpdateLabOrderItemDto,
    actorId: string,
  ): Promise<LabOrder> {
    await commitThenEmit(
      this.dataSource,
      this.eventEmitter,
      async (manager, after) => {
        const item = await this.loadItem(manager, orderId, itemId);
        const from = item.status;
        const target = dto.status ?? from;
        assertTransition(from, target);
        const ready = target === S.RESULT_READY;
        if (dto.resultData !== undefined || ready) {
          const data = dto.resultData ?? item.resultData ?? {};
          applyResultData(
            item,
            item.test,
            data,
            patientContext(item.order.patient, new Date()),
            ready,
          );
        }
        if (dto.resultNotes !== undefined)
          item.resultNotes = dto.resultNotes.trim() || null;
        if ((target === S.COLLECTED || ready) && !item.collectedAt) {
          item.collectedAt = new Date();
          item.collectedById = actorId;
        }
        if (ready) {
          item.resultedAt = new Date();
          item.resultedById = actorId;
        }
        item.status = target;
        await manager.save(LabOrderItem, item);
        await this.progress.reconcile(manager, after, orderId);
        if (ready && from !== S.RESULT_READY) {
          after.emit(
            LabResultReadyEvent.name,
            new LabResultReadyEvent(
              orderId,
              item.id,
              item.order.patientId,
              actorId,
              item.test?.name ?? 'Lab test',
            ),
          );
        }
      },
    );
    return this.labOrders.findOne(orderId);
  }

  async verify(
    orderId: string,
    itemId: string,
    actorId: string,
  ): Promise<LabOrder> {
    await commitThenEmit(
      this.dataSource,
      this.eventEmitter,
      async (manager, after) => {
        const item = await this.loadItem(manager, orderId, itemId);
        if (item.status !== S.RESULT_READY || !item.resultData) {
          throw new ConflictException(
            'Only an entered result that is ready can be verified',
          );
        }
        item.status = S.VERIFIED;
        item.verifiedById = actorId;
        item.verifiedAt = new Date();
        await manager.save(LabOrderItem, item);
        const completed = await this.progress.reconcile(
          manager,
          after,
          orderId,
        );
        // The order-completed alert already covers the last test of an order.
        if (!completed)
          after.emit(LabResultVerifiedEvent.name, verifiedEvent(item));
      },
    );
    return this.labOrders.findOne(orderId);
  }

  async amend(
    orderId: string,
    itemId: string,
    dto: AmendLabResultDTO,
    actorId: string,
  ): Promise<LabOrder> {
    await commitThenEmit(
      this.dataSource,
      this.eventEmitter,
      async (manager, after) => {
        const item = await this.loadItem(manager, orderId, itemId);
        if (item.status !== S.VERIFIED) {
          assertEditable(item.status);
          throw new ConflictException(
            'This result is not verified yet; edit it directly',
          );
        }
        const before = manager.create(LabResultAmendment, {
          itemId: item.id,
          previousData: item.resultData,
          previousFlags: item.resultFlags,
          previousNotes: item.resultNotes,
          previousVerifiedAt: item.verifiedAt,
          reason: dto.reason.trim(),
          amendedById: actorId,
        });
        applyResultData(
          item,
          item.test,
          dto.resultData,
          patientContext(item.order.patient, new Date()),
          true,
        );
        if (dto.resultNotes !== undefined)
          item.resultNotes = dto.resultNotes.trim() || null;
        item.verifiedById = actorId;
        item.verifiedAt = new Date();
        await manager.save(LabResultAmendment, {
          ...before,
          newData: item.resultData,
          newNotes: item.resultNotes,
        });
        await manager.save(LabOrderItem, item);
        after.emit(LabResultVerifiedEvent.name, verifiedEvent(item, true));
      },
    );
    return this.labOrders.findOne(orderId);
  }

  // The row lock stops two people verifying or amending the same result at once.
  private async loadItem(
    manager: EntityManager,
    orderId: string,
    itemId: string,
  ): Promise<LabOrderItem> {
    await manager.findOne(LabOrderItem, {
      where: { id: itemId, orderId },
      lock: { mode: 'pessimistic_write' },
    });
    const item = await manager.findOne(LabOrderItem, {
      where: { id: itemId, orderId },
      relations: { test: true, order: { patient: true } },
    });
    if (!item) throw new NotFoundException('Lab order item not found');
    return item;
  }
}
