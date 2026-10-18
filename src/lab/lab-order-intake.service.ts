import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { commitThenEmit } from 'common/events/after-commit';
import { PatientsService } from 'src/patients/patients.service';
import { VisitIntenentsEnum } from 'src/queue/enums/visit-type.enum';
import { LabOnlyVisitsService } from 'src/queue/lab-only-visits.service';
import { QueueEntriesService } from 'src/queue/queue-entries.service';
import { UsersService } from 'src/users/users.service';
import { CreateLabOrderDto } from './dto/create-lab-order.dto';
import { LabOrderItem } from './entities/lab-order-item.entity';
import { LabOrder } from './entities/lab-order.entity';
import { LabTest } from './entities/lab-test.entity';
import { LabOrderItemStatus } from './enums/lab-order-item-status.enum';
import { LabOrderStatus } from './enums/lab-order-status.enum';
import { LabPriority } from './enums/lab-priority.enum';
import { LabOrderCreatedEvent } from './events/lab-order-created.event';
import { resolveOrderVisit } from './orders/resolve-order-visit';

/** Raising lab orders from a consultation, the lab bench or reception (L1, L9). */
@Injectable()
export class LabOrderIntakeService {
  private readonly logger = new Logger(LabOrderIntakeService.name);

  constructor(
    @InjectRepository(LabTest)
    private readonly labTests: Repository<LabTest>,
    private readonly patients: PatientsService,
    private readonly users: UsersService,
    private readonly dataSource: DataSource,
    private readonly events: EventEmitter2,
    private readonly queueEntries: QueueEntriesService,
    private readonly labOnlyVisits: LabOnlyVisitsService,
  ) {}

  async createOrder(
    dto: CreateLabOrderDto,
    orderedById: string,
  ): Promise<LabOrder> {
    await this.patients.findOne(dto.patientId);
    await this.users.findOne(orderedById);
    const testIds = await this.activeTestIds(dto);

    return commitThenEmit(
      this.dataSource,
      this.events,
      async (manager, after) => {
        const links = await resolveOrderVisit(
          manager,
          dto,
          orderedById,
          after,
          this.labOnlyVisits,
        );
        const saved = await manager.save(
          manager.create(LabOrder, {
            patientId: dto.patientId,
            ...links,
            orderedById,
            status: LabOrderStatus.PENDING,
            priority: dto.priority ?? LabPriority.ROUTINE,
            clinicalNotes: dto.clinicalNotes?.trim() || null,
            referringClinician: dto.referringClinician?.trim() || null,
          }),
        );
        await manager.save(
          testIds.map((testId) =>
            manager.create(LabOrderItem, {
              orderId: saved.id,
              testId,
              status: LabOrderItemStatus.PENDING,
            }),
          ),
        );
        const full = await manager.findOneOrFail(LabOrder, {
          where: { id: saved.id },
          relations: { items: { test: true }, patient: true, orderedBy: true },
        });
        after.emit(LabOrderCreatedEvent.name, createdEvent(full));
        after.run(() => this.enqueueForLab(links.visitId));
        return full;
      },
    );
  }

  private async activeTestIds(dto: CreateLabOrderDto): Promise<string[]> {
    const testIds = [...new Set(dto.items.map((i) => i.testId))];
    if (testIds.length !== dto.items.length) {
      throw new BadRequestException('Duplicate tests in the order');
    }
    const found = await this.labTests.count({
      where: { id: In(testIds), isActive: true },
    });
    if (found !== testIds.length) {
      throw new BadRequestException(
        'One or more lab tests are invalid or inactive',
      );
    }
    return testIds;
  }

  // Queueing is best-effort; the order stands regardless.
  private async enqueueForLab(visitId: string): Promise<void> {
    try {
      await this.queueEntries.ensureIntent(visitId, VisitIntenentsEnum.LAB);
    } catch (err) {
      this.logger.warn(
        `Failed to enqueue visit ${visitId} for lab: ${(err as Error).message}`,
      );
    }
  }
}

const createdEvent = (order: LabOrder) =>
  new LabOrderCreatedEvent(
    order.id,
    order.patientId,
    order.orderedById,
    order.visitId,
    order.items.map((item) => ({
      itemId: item.id,
      testName: item.test.name,
      price: item.test.price,
    })),
  );
