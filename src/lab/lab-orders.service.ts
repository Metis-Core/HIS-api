import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { BaseCrudService } from 'common/services/crud.service';
import { IPagination } from 'common/response-format';
import { Department } from 'common/enums/department.enum';
import { PatientsService } from 'src/patients/patients.service';
import { QueueEntriesService } from 'src/queue/queue-entries.service';
import { UsersService } from 'src/users/users.service';
import { CreateLabOrderDto } from './dto/create-lab-order.dto';
import { QueryLabOrdersDto } from './dto/query-lab-orders.dto';
import { UpdateLabOrderItemDto } from './dto/update-lab-order-item.dto';
import { UpdateLabOrderDto } from './dto/update-lab-order.dto';
import { LabOrderItem } from './entities/lab-order-item.entity';
import { LabOrder } from './entities/lab-order.entity';
import { LabTest } from './entities/lab-test.entity';
import { LabOrderItemStatus } from './enums/lab-order-item-status.enum';
import { LabOrderStatus } from './enums/lab-order-status.enum';
import { LabPriority } from './enums/lab-priority.enum';
import { LabOrderCreatedEvent } from './events/lab-order-created.event';
import { LabOrderCompletedEvent } from './events/lab-order-completed.event';

@Injectable()
export class LabOrdersService extends BaseCrudService<LabOrder> {
  constructor(
    @InjectRepository(LabOrder)
    private readonly labOrdersRepository: Repository<LabOrder>,
    @InjectRepository(LabOrderItem)
    private readonly labOrderItemsRepository: Repository<LabOrderItem>,
    @InjectRepository(LabTest)
    private readonly labTestsRepository: Repository<LabTest>,
    private readonly patientsService: PatientsService,
    private readonly usersService: UsersService,
    private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
    private readonly queueEntries: QueueEntriesService,
  ) {
    super(labOrdersRepository);
  }

  async createOrder(
    dto: CreateLabOrderDto,
    orderedById: string,
  ): Promise<LabOrder> {
    await this.patientsService.findOne(dto.patientId);
    await this.usersService.findOne(orderedById);

    const testIds = [...new Set(dto.items.map((i) => i.testId))];
    if (testIds.length !== dto.items.length) {
      throw new BadRequestException('Duplicate tests in the order');
    }

    const tests = await this.labTestsRepository.find({
      where: { id: In(testIds), isActive: true },
    });
    if (tests.length !== testIds.length) {
      throw new BadRequestException('One or more lab tests are invalid or inactive');
    }

    return this.dataSource.transaction(async (manager) => {
      const order = manager.create(LabOrder, {
        patientId: dto.patientId,
        consultationId: dto.consultationId ?? null,
        visitId: dto.visitId ?? null,
        orderedById,
        status: LabOrderStatus.PENDING,
        priority: dto.priority ?? LabPriority.ROUTINE,
        clinicalNotes: dto.clinicalNotes?.trim() ?? null,
      });
      const savedOrder = await manager.save(order);

      const items = testIds.map((testId) =>
        manager.create(LabOrderItem, {
          orderId: savedOrder.id,
          testId,
          status: LabOrderItemStatus.PENDING,
        }),
      );
      await manager.save(items);

      const full = await manager.findOneOrFail(LabOrder, {
        where: { id: savedOrder.id },
        relations: { items: { test: true }, patient: true, orderedBy: true },
      });

      this.eventEmitter.emit(
        LabOrderCreatedEvent.name,
        new LabOrderCreatedEvent(full.id, full.patientId, orderedById),
      );
      return full;
    });
  }

  override async findOne(id: string): Promise<LabOrder> {
    const order = await this.labOrdersRepository.findOne({
      where: { id },
      relations: { items: { test: true }, patient: true, orderedBy: true, consultation: true },
    });
    if (!order) {
      throw new NotFoundException('Lab order not found');
    }
    return order;
  }

  async search(query: QueryLabOrdersDto): Promise<IPagination<LabOrder>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const sortOrder = query.sortOrder ?? 'DESC';

    const qb = this.labOrdersRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.patient', 'patient')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.test', 'test');

    if (query.patientId) qb.andWhere('order.patientId = :patientId', { patientId: query.patientId });
    if (query.consultationId) qb.andWhere('order.consultationId = :consultationId', { consultationId: query.consultationId });
    if (query.visitId) qb.andWhere('order.visitId = :visitId', { visitId: query.visitId });
    if (query.orderedById) qb.andWhere('order.orderedById = :orderedById', { orderedById: query.orderedById });
    if (query.status) qb.andWhere('order.status = :status', { status: query.status });
    if (query.priority) qb.andWhere('order.priority = :priority', { priority: query.priority });

    const [items, total] = await qb
      .orderBy('order.createdAt', sortOrder)
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { items, total };
  }

  async findByPatient(patientId: string): Promise<LabOrder[]> {
    await this.patientsService.findOne(patientId);
    return this.labOrdersRepository.find({
      where: { patientId },
      relations: { items: { test: true } },
      order: { createdAt: 'DESC' },
    });
  }

  async findByConsultation(consultationId: string): Promise<LabOrder[]> {
    return this.labOrdersRepository.find({
      where: { consultationId },
      relations: { items: { test: true } },
      order: { createdAt: 'DESC' },
    });
  }

  async updateOrder(id: string, dto: UpdateLabOrderDto): Promise<LabOrder> {
    const order = await this.findOne(id);
    if (order.status === LabOrderStatus.CANCELLED) {
      throw new BadRequestException('Cancelled orders cannot be updated');
    }
    if (dto.status !== undefined) order.status = dto.status;
    if (dto.priority !== undefined) order.priority = dto.priority;
    if (dto.clinicalNotes !== undefined) {
      order.clinicalNotes = dto.clinicalNotes?.trim() || null;
    }
    if (order.status === LabOrderStatus.COMPLETED && !order.completedAt) {
      order.completedAt = new Date();
    }
    await this.labOrdersRepository.save(order);
    return this.findOne(id);
  }

  async cancelOrder(id: string, reason?: string): Promise<LabOrder> {
    const order = await this.findOne(id);
    if (order.status === LabOrderStatus.CANCELLED) return order;

    return this.dataSource.transaction(async (manager) => {
      order.status = LabOrderStatus.CANCELLED;
      order.completedAt = order.completedAt ?? new Date();
      if (reason) order.clinicalNotes = reason;
      await manager.save(order);

      await manager.update(
        LabOrderItem,
        { orderId: id, status: In([LabOrderItemStatus.PENDING, LabOrderItemStatus.COLLECTED, LabOrderItemStatus.IN_PROCESS]) },
        { status: LabOrderItemStatus.CANCELLED },
      );

      return this.findOne(id);
    });
  }

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
    if (dto.resultValue !== undefined) item.resultValue = dto.resultValue?.trim() || null;
    if (dto.resultNotes !== undefined) item.resultNotes = dto.resultNotes?.trim() || null;
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
    return this.findOne(orderId);
  }

  private async reconcileOrderStatus(orderId: string): Promise<void> {
    const items = await this.labOrderItemsRepository.find({ where: { orderId } });
    const order = await this.labOrdersRepository.findOneOrFail({ where: { id: orderId } });

    if (order.status === LabOrderStatus.CANCELLED) return;

    const anyInProgress = items.some((i) =>
      [LabOrderItemStatus.COLLECTED, LabOrderItemStatus.IN_PROCESS].includes(i.status),
    );
    const allTerminal = items.every((i) =>
      [LabOrderItemStatus.RESULT_READY, LabOrderItemStatus.CANCELLED].includes(i.status),
    );
    const anyReady = items.some((i) => i.status === LabOrderItemStatus.RESULT_READY);

    if (allTerminal && anyReady) {
      order.status = LabOrderStatus.COMPLETED;
      order.completedAt = order.completedAt ?? new Date();
      await this.labOrdersRepository.save(order);
      if (order.visitId) {
        await this.queueEntries.completeCurrentFor(order.visitId, Department.MAIN_LABORATORY);
      }
      this.eventEmitter.emit(
        LabOrderCompletedEvent.name,
        new LabOrderCompletedEvent(order.id, order.patientId, order.orderedById),
      );
    } else if (anyInProgress && order.status === LabOrderStatus.PENDING) {
      order.status = LabOrderStatus.IN_PROGRESS;
      await this.labOrdersRepository.save(order);
    }
  }
}
