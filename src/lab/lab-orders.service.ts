import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { BaseCrudService } from 'common/services/crud.service';
import { IPagination } from 'common/response-format';
import { PatientsService } from 'src/patients/patients.service';
import { QueueEntriesService } from 'src/queue/queue-entries.service';
import { VisitIntenentsEnum } from 'src/queue/enums/visit-type.enum';
import { UsersService } from 'src/users/users.service';
import { CreateLabOrderDto } from './dto/create-lab-order.dto';
import { QueryLabOrdersDto } from './dto/query-lab-orders.dto';
import { UpdateLabOrderDto } from './dto/update-lab-order.dto';
import { LabOrderItem } from './entities/lab-order-item.entity';
import { LabOrder } from './entities/lab-order.entity';
import { LabTest } from './entities/lab-test.entity';
import { LabOrderItemStatus } from './enums/lab-order-item-status.enum';
import { LabOrderStatus } from './enums/lab-order-status.enum';
import { LabPriority } from './enums/lab-priority.enum';
import { LabOrderCreatedEvent } from './events/lab-order-created.event';
import { LabOrderCancelledEvent } from './events/lab-order-cancelled.event';
import { PaginationQueryDTO, pageWindow, toPage } from 'common/pagination';
import { commitThenEmit } from 'common/events/after-commit';
import { wherePatientMatches } from 'common/utils/query-list';

@Injectable()
export class LabOrdersService extends BaseCrudService<LabOrder> {
  private readonly logger = new Logger(LabOrdersService.name);

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

    const order = await commitThenEmit(
      this.dataSource,
      this.eventEmitter,
      async (manager, after) => {
        const saved = await manager.save(
          manager.create(LabOrder, {
            patientId: dto.patientId,
            consultationId: dto.consultationId ?? null,
            visitId: dto.visitId ?? null,
            orderedById,
            status: LabOrderStatus.PENDING,
            priority: dto.priority ?? LabPriority.ROUTINE,
            clinicalNotes: dto.clinicalNotes?.trim() ?? null,
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
        after.run(() => this.enqueueForLab(full.visitId));
        return full;
      },
    );
    return order;
  }

  // Queueing is best-effort; the order stands regardless.
  private async enqueueForLab(visitId: string | null): Promise<void> {
    if (!visitId) return;
    try {
      await this.queueEntries.ensureIntent(visitId, VisitIntenentsEnum.LAB);
    } catch (err) {
      this.logger.warn(
        `Failed to enqueue visit ${visitId} for lab: ${(err as Error).message}`,
      );
    }
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
    const window = pageWindow(query);
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
    if (query.status?.length) qb.andWhere('order.status IN (:...statuses)', { statuses: query.status });
    wherePatientMatches(qb, 'patient', query.search);
    if (query.priority) qb.andWhere('order.priority = :priority', { priority: query.priority });

    const [items, total] = await qb
      .orderBy('order.createdAt', sortOrder)
      // Tie-break on id so rows never repeat or vanish between pages.
      .addOrderBy('order.id', sortOrder)
      .skip(window.skip)
      .take(window.take)
      .getManyAndCount();

    return toPage(items, total, window);
  }

  // Patient history grows for years, so it is paged newest-first like every other list.
  async findByPatient(
    patientId: string,
    query: PaginationQueryDTO = {},
  ): Promise<IPagination<LabOrder>> {
    await this.patientsService.findOne(patientId);
    return this.findPage(
      {
        where: { patientId },
        relations: { items: { test: true } },
        order: { createdAt: 'DESC', id: 'DESC' },
      },
      query,
    );
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

    return commitThenEmit(
      this.dataSource,
      this.eventEmitter,
      async (manager, after) => {
        order.status = LabOrderStatus.CANCELLED;
        order.completedAt = order.completedAt ?? new Date();
        if (reason) order.clinicalNotes = reason;
        await manager.save(order);
        await manager.update(
          LabOrderItem,
          { orderId: id, status: In(CANCELLABLE_ITEM_STATUSES) },
          { status: LabOrderItemStatus.CANCELLED },
        );
        after.emit(
          LabOrderCancelledEvent.name,
          new LabOrderCancelledEvent(order.id, order.patientId, order.orderedById),
        );
        return order;
      },
    ).then(() => this.findOne(id));
  }
}

const CANCELLABLE_ITEM_STATUSES = [
  LabOrderItemStatus.PENDING,
  LabOrderItemStatus.COLLECTED,
  LabOrderItemStatus.IN_PROCESS,
];

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
