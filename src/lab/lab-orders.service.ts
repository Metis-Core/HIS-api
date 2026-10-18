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
import { PatientsService } from 'src/patients/patients.service';
import { QueryLabOrdersDto } from './dto/query-lab-orders.dto';
import { UpdateLabOrderDto } from './dto/update-lab-order.dto';
import { LabOrderItem } from './entities/lab-order-item.entity';
import { LabOrder } from './entities/lab-order.entity';
import { LabOrderItemStatus } from './enums/lab-order-item-status.enum';
import { LabOrderStatus } from './enums/lab-order-status.enum';
import { LabOrderCancelledEvent } from './events/lab-order-cancelled.event';
import { PaginationQueryDTO, pageWindow, toPage } from 'common/pagination';
import { commitThenEmit } from 'common/events/after-commit';
import { wherePatientMatches } from 'common/utils/query-list';

@Injectable()
export class LabOrdersService extends BaseCrudService<LabOrder> {
  constructor(
    @InjectRepository(LabOrder)
    private readonly labOrdersRepository: Repository<LabOrder>,
    @InjectRepository(LabOrderItem)
    private readonly labOrderItemsRepository: Repository<LabOrderItem>,
    private readonly patientsService: PatientsService,
    private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
  ) {
    super(labOrdersRepository);
  }

  override async findOne(id: string): Promise<LabOrder> {
    const order = await this.labOrdersRepository.findOne({
      where: { id },
      relations: {
        items: {
          test: true,
          resultedBy: true,
          verifiedBy: true,
          collectedBy: true,
        },
        patient: true,
        orderedBy: true,
        consultation: true,
      },
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

    if (query.patientId)
      qb.andWhere('order.patientId = :patientId', {
        patientId: query.patientId,
      });
    if (query.consultationId)
      qb.andWhere('order.consultationId = :consultationId', {
        consultationId: query.consultationId,
      });
    if (query.visitId)
      qb.andWhere('order.visitId = :visitId', { visitId: query.visitId });
    if (query.orderedById)
      qb.andWhere('order.orderedById = :orderedById', {
        orderedById: query.orderedById,
      });
    if (query.status?.length)
      qb.andWhere('order.status IN (:...statuses)', { statuses: query.status });
    wherePatientMatches(qb, 'patient', query.search);
    if (query.priority)
      qb.andWhere('order.priority = :priority', { priority: query.priority });

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
    if (dto.priority !== undefined) order.priority = dto.priority;
    if (dto.clinicalNotes !== undefined) {
      order.clinicalNotes = dto.clinicalNotes?.trim() || null;
    }
    await this.labOrdersRepository.save(order);
    return this.findOne(id);
  }

  async cancelOrder(
    id: string,
    reason: string | undefined,
    cancelledById: string,
  ): Promise<LabOrder> {
    const order = await this.findOne(id);
    if (order.status === LabOrderStatus.CANCELLED) return order;

    return commitThenEmit(
      this.dataSource,
      this.eventEmitter,
      async (manager, after) => {
        order.status = LabOrderStatus.CANCELLED;
        order.completedAt = order.completedAt ?? new Date();
        // The reason has its own column so the clinician's notes are never overwritten.
        order.cancellationReason = reason?.trim() || null;
        order.cancelledById = cancelledById;
        await manager.save(order);
        await manager.update(
          LabOrderItem,
          { orderId: id, status: In(CANCELLABLE_ITEM_STATUSES) },
          { status: LabOrderItemStatus.CANCELLED },
        );
        after.emit(
          LabOrderCancelledEvent.name,
          new LabOrderCancelledEvent(
            order.id,
            order.patientId,
            order.orderedById,
          ),
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
