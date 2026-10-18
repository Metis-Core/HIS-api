import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import { BaseCrudService } from 'common/services/crud.service';
import { IPagination } from 'common/response-format';
import { pageWindow, toPage } from 'common/pagination';
import { Department } from 'common/enums/department.enum';
import { UserRole } from 'common/enums/userRoles.enum';
import { containsPattern } from 'common/utils/like-pattern';
import { Consultation } from 'src/consultation/entities/consultation.entity';
import { patientContext } from 'src/lab/results/patient-context';
import { PatientsService } from 'src/patients/patients.service';
import { Visit } from 'src/queue/entities/visit.entity';
import { VisitIntenentsEnum } from 'src/queue/enums/visit-type.enum';
import { canActOnStage } from 'src/queue/journey/department-access.policy';
import { QueueEntriesService } from 'src/queue/queue-entries.service';
import { buildCompletion } from './complete-order';
import { CreateProcedureOrderDto } from './dto/create-procedure-order.dto';
import { QueryProcedureOrdersDto } from './dto/query-procedure-orders.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { ProcedureOrder } from './entities/procedure-order.entity';
import { ProcedureTest } from './entities/procedure-test.entity';
import { OrderKind } from './enums/order-kind.enum';
import { OrderStatus } from './enums/order-status.enum';
import {
  ProcedureCancelledEvent,
  ProcedureOrderedEvent,
} from './events/procedure-order.events';
import {
  OPEN_ORDER_STATUSES,
  assertOrderTransition,
} from './order-state-machine';

const KIND_DEPARTMENT: Record<OrderKind, Department> = {
  [OrderKind.RADIOLOGY]: Department.RADIOLOGY,
  [OrderKind.SURGERY]: Department.INPATIENT_WARD,
};

const KIND_INTENT: Record<OrderKind, VisitIntenentsEnum> = {
  [OrderKind.RADIOLOGY]: VisitIntenentsEnum.RADIOLOGY,
  [OrderKind.SURGERY]: VisitIntenentsEnum.SURGERY,
};

export interface OrderActor {
  id: string;
  role: UserRole;
}

@Injectable()
export class ProcedureOrdersService extends BaseCrudService<ProcedureOrder> {
  private readonly logger = new Logger(ProcedureOrdersService.name);

  constructor(
    @InjectRepository(ProcedureOrder)
    private readonly orders: Repository<ProcedureOrder>,
    @InjectRepository(ProcedureTest)
    private readonly tests: Repository<ProcedureTest>,
    @InjectRepository(Visit)
    private readonly visits: Repository<Visit>,
    @InjectRepository(Consultation)
    private readonly consultations: Repository<Consultation>,
    private readonly patients: PatientsService,
    private readonly queueEntries: QueueEntriesService,
    private readonly events: EventEmitter2,
  ) {
    super(orders);
  }

  async place(
    dto: CreateProcedureOrderDto,
    orderedById: string,
  ): Promise<ProcedureOrder> {
    await this.patients.findOne(dto.patientId);
    await this.assertLinks(dto);
    const test = await this.tests.findOne({ where: { id: dto.testId } });
    if (!test) throw new NotFoundException('Test not found in the catalogue');
    if (!test.isActive) {
      throw new BadRequestException(
        `${test.name} is not active and cannot be ordered`,
      );
    }
    const saved = await this.orders.save(
      this.orders.create({
        patientId: dto.patientId,
        visitId: dto.visitId ?? null,
        consultationId: dto.consultationId ?? null,
        testId: test.id,
        kind: test.kind,
        name: test.name,
        priority: dto.priority,
        indication: dto.indication?.trim() || null,
        orderedById,
      }),
    );
    this.events.emit(
      ProcedureOrderedEvent.channel,
      new ProcedureOrderedEvent(
        saved.id,
        saved.visitId,
        saved.kind,
        saved.name,
        test.price,
        orderedById,
      ),
    );
    await this.enqueue(saved);
    return this.details(saved.id);
  }

  async details(id: string): Promise<ProcedureOrder> {
    const order = await this.orders.findOne({
      where: { id },
      relations: {
        patient: true,
        orderedBy: true,
        performedBy: true,
        test: true,
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async search(
    query: QueryProcedureOrdersDto,
  ): Promise<IPagination<ProcedureOrder>> {
    const window = pageWindow(query);
    const sortOrder = query.sortOrder ?? 'DESC';
    const qb = this.orders
      .createQueryBuilder('o')
      .leftJoinAndSelect('o.patient', 'patient')
      .leftJoinAndSelect('o.orderedBy', 'orderedBy')
      .leftJoinAndSelect('o.test', 'test');
    if (query.kind) qb.andWhere('o.kind = :kind', { kind: query.kind });
    if (query.status?.length) {
      qb.andWhere('o.status IN (:...statuses)', { statuses: query.status });
    }
    if (query.patientId)
      qb.andWhere('o.patientId = :patientId', { patientId: query.patientId });
    if (query.visitId)
      qb.andWhere('o.visitId = :visitId', { visitId: query.visitId });
    if (query.search?.trim()) {
      qb.andWhere(
        `(o.name ILIKE :term OR patient.mrn ILIKE :term OR patient.firstName ILIKE :term OR patient.lastName ILIKE :term)`,
        { term: containsPattern(query.search.trim()) },
      );
    }
    qb.orderBy('o.createdAt', sortOrder)
      .addOrderBy('o.id', sortOrder)
      .skip(window.skip)
      .take(window.take);
    const [items, total] = await qb.getManyAndCount();
    return toPage(items, total, window);
  }

  async advance(
    id: string,
    dto: UpdateOrderStatusDto,
    actor: OrderActor,
  ): Promise<ProcedureOrder> {
    const order = await this.details(id);
    if (!canActOnStage(actor.role, KIND_DEPARTMENT[order.kind])) {
      throw new ForbiddenException(
        `Role '${actor.role}' cannot work on ${order.kind} orders`,
      );
    }
    assertOrderTransition(order.status, dto.status);
    this.applyStatus(order, dto, actor);
    await this.orders.save(order);
    if (dto.status === OrderStatus.CANCELLED) {
      this.events.emit(
        ProcedureCancelledEvent.channel,
        new ProcedureCancelledEvent(order.id),
      );
    }
    if (
      dto.status === OrderStatus.COMPLETED ||
      dto.status === OrderStatus.CANCELLED
    ) {
      await this.releaseStage(order);
    }
    return this.details(id);
  }

  private applyStatus(
    order: ProcedureOrder,
    dto: UpdateOrderStatusDto,
    actor: OrderActor,
  ): void {
    order.status = dto.status;
    switch (dto.status) {
      case OrderStatus.SCHEDULED:
        if (!dto.scheduledFor) {
          throw new BadRequestException(
            'Give the date and time it is scheduled for',
          );
        }
        order.scheduledFor = dto.scheduledFor;
        break;
      case OrderStatus.IN_PROGRESS:
        order.performedById = actor.id;
        break;
      case OrderStatus.COMPLETED:
        Object.assign(
          order,
          buildCompletion({
            kind: order.kind,
            schema: order.test.resultSchema,
            resultData: dto.resultData,
            classification: dto.classification,
            impression: dto.impression,
            report: dto.report,
            patient: patientContext(order.patient, new Date()),
          }),
        );
        order.performedById = order.performedById ?? actor.id;
        order.completedAt = new Date();
        break;
      case OrderStatus.CANCELLED:
        if (!dto.reason?.trim()) {
          throw new BadRequestException(
            'Give a reason for cancelling the order',
          );
        }
        order.cancellationReason = dto.reason.trim();
        break;
      default:
        break;
    }
  }

  private async assertLinks(dto: CreateProcedureOrderDto): Promise<void> {
    if (dto.visitId) {
      const visit = await this.visits.findOne({
        where: { id: dto.visitId },
        select: { id: true, patientId: true },
      });
      if (!visit) throw new NotFoundException('Visit not found');
      if (visit.patientId !== dto.patientId) {
        throw new BadRequestException('Visit does not belong to this patient');
      }
    }
    if (dto.consultationId) {
      const consultation = await this.consultations.findOne({
        where: { id: dto.consultationId },
        select: { id: true, patientId: true },
      });
      if (!consultation) throw new NotFoundException('Consultation not found');
      if (consultation.patientId !== dto.patientId) {
        throw new BadRequestException(
          'Consultation does not belong to this patient',
        );
      }
    }
  }

  private async enqueue(order: ProcedureOrder): Promise<void> {
    if (!order.visitId) return;
    try {
      await this.queueEntries.ensureIntent(
        order.visitId,
        KIND_INTENT[order.kind],
      );
    } catch (error) {
      this.logger.warn(
        `Failed to queue visit ${order.visitId} for ${order.kind}: ${(error as Error).message}`,
      );
    }
  }

  private async releaseStage(order: ProcedureOrder): Promise<void> {
    if (!order.visitId) return;
    const stillOpen = await this.orders.count({
      where: {
        visitId: order.visitId,
        kind: order.kind,
        id: Not(order.id),
        status: In([...OPEN_ORDER_STATUSES]),
      },
    });
    if (stillOpen === 0) {
      await this.queueEntries.completeCurrentFor(
        order.visitId,
        KIND_DEPARTMENT[order.kind],
      );
    }
  }
}
