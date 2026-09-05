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
import { Department } from 'common/enums/department.enum';
import { InventoryStockService } from 'src/inventory/inventory-stock.service';
import { InventoryItem } from 'src/inventory/entities/inventory-item.entity';
import { InventoryTransactionType } from 'src/inventory/enums/inventoryTransactionType.enum';
import { PatientsService } from 'src/patients/patients.service';
import { QueueEntriesService } from 'src/queue/queue-entries.service';
import { VisitIntenentsEnum } from 'src/queue/enums/visit-type.enum';
import { UsersService } from 'src/users/users.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { DispensePrescriptionDto } from './dto/dispense-prescription.dto';
import { QueryPrescriptionsDto } from './dto/query-prescriptions.dto';
import { Dispense } from './entities/dispense.entity';
import { DispenseItem } from './entities/dispense-item.entity';
import { PrescriptionItem } from './entities/prescription-item.entity';
import { Prescription } from './entities/prescription.entity';
import { PrescriptionItemStatus } from './enums/prescription-item-status.enum';
import { PrescriptionStatus } from './enums/prescription-status.enum';
import { PrescriptionDispensedEvent } from './events/prescription-dispensed.event';

@Injectable()
export class PharmacyService extends BaseCrudService<Prescription> {
  private readonly logger = new Logger(PharmacyService.name);

  constructor(
    @InjectRepository(Prescription)
    private readonly prescriptionsRepository: Repository<Prescription>,
    @InjectRepository(PrescriptionItem)
    private readonly prescriptionItemsRepository: Repository<PrescriptionItem>,
    @InjectRepository(Dispense)
    private readonly dispensesRepository: Repository<Dispense>,
    @InjectRepository(InventoryItem)
    private readonly inventoryItemsRepository: Repository<InventoryItem>,
    private readonly patientsService: PatientsService,
    private readonly usersService: UsersService,
    private readonly stockService: InventoryStockService,
    private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
    private readonly queueEntries: QueueEntriesService,
  ) {
    super(prescriptionsRepository);
  }

  async createPrescription(
    dto: CreatePrescriptionDto,
    prescribedById: string,
  ): Promise<Prescription> {
    await this.patientsService.findOne(dto.patientId);
    await this.usersService.findOne(prescribedById);

    const itemIds = [...new Set(dto.items.map((i) => i.itemId))];
    if (itemIds.length !== dto.items.length) {
      throw new BadRequestException('Duplicate items in the prescription');
    }
    const items = await this.inventoryItemsRepository.find({
      where: { id: In(itemIds), isActive: true },
    });
    if (items.length !== itemIds.length) {
      throw new BadRequestException('One or more items are invalid or inactive');
    }

    return this.dataSource.transaction(async (manager) => {
      const prescription = manager.create(Prescription, {
        patientId: dto.patientId,
        consultationId: dto.consultationId ?? null,
        prescribedById,
        status: PrescriptionStatus.PENDING,
        notes: dto.notes?.trim() ?? null,
      });
      const saved = await manager.save(prescription);

      const rows = dto.items.map((i) =>
        manager.create(PrescriptionItem, {
          prescriptionId: saved.id,
          itemId: i.itemId,
          dosage: i.dosage.trim(),
          frequency: i.frequency.trim(),
          duration: i.duration?.trim() ?? null,
          quantity: i.quantity,
          dispensedQuantity: 0,
          status: PrescriptionItemStatus.PENDING,
          instructions: i.instructions?.trim() ?? null,
        }),
      );
      await manager.save(rows);

      const full = await manager.findOneOrFail(Prescription, {
        where: { id: saved.id },
        relations: { items: { item: true }, patient: true, prescribedBy: true },
      });

      if (dto.visitId) {
        try {
          await this.queueEntries.ensureIntent(dto.visitId, VisitIntenentsEnum.PHARMACY);
        } catch (err) {
          // Queue enqueue is best-effort; the prescription stands regardless.
          this.logger.warn(`Failed to enqueue visit ${dto.visitId} for pharmacy: ${(err as Error).message}`);
        }
      }

      return full;
    });
  }

  override async findOne(id: string): Promise<Prescription> {
    const prescription = await this.prescriptionsRepository.findOne({
      where: { id },
      relations: { items: { item: true }, patient: true, prescribedBy: true, consultation: true },
    });
    if (!prescription) {
      throw new NotFoundException('Prescription not found');
    }
    return prescription;
  }

  async search(query: QueryPrescriptionsDto): Promise<IPagination<Prescription>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const sortOrder = query.sortOrder ?? 'DESC';

    const qb = this.prescriptionsRepository
      .createQueryBuilder('prescription')
      .leftJoinAndSelect('prescription.patient', 'patient')
      .leftJoinAndSelect('prescription.items', 'items')
      .leftJoinAndSelect('items.item', 'item');

    if (query.patientId) qb.andWhere('prescription.patientId = :patientId', { patientId: query.patientId });
    if (query.consultationId) qb.andWhere('prescription.consultationId = :consultationId', { consultationId: query.consultationId });
    if (query.prescribedById) qb.andWhere('prescription.prescribedById = :prescribedById', { prescribedById: query.prescribedById });
    if (query.status) qb.andWhere('prescription.status = :status', { status: query.status });

    const [items, total] = await qb
      .orderBy('prescription.createdAt', sortOrder)
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { items, total };
  }

  async findByPatient(patientId: string): Promise<Prescription[]> {
    await this.patientsService.findOne(patientId);
    return this.prescriptionsRepository.find({
      where: { patientId },
      relations: { items: { item: true } },
      order: { createdAt: 'DESC' },
    });
  }

  async cancelPrescription(id: string, reason?: string): Promise<Prescription> {
    const prescription = await this.findOne(id);
    if (prescription.status === PrescriptionStatus.CANCELLED) return prescription;
    if (prescription.status === PrescriptionStatus.DISPENSED) {
      throw new BadRequestException('Fully dispensed prescriptions cannot be cancelled');
    }

    return this.dataSource.transaction(async (manager) => {
      prescription.status = PrescriptionStatus.CANCELLED;
      if (reason) prescription.notes = reason;
      await manager.save(prescription);
      await manager.update(
        PrescriptionItem,
        { prescriptionId: id, status: In([PrescriptionItemStatus.PENDING, PrescriptionItemStatus.PARTIAL]) },
        { status: PrescriptionItemStatus.CANCELLED },
      );
      return this.findOne(id);
    });
  }

  async dispense(
    prescriptionId: string,
    dto: DispensePrescriptionDto,
    dispensedById: string,
  ): Promise<Dispense> {
    const prescription = await this.findOne(prescriptionId);
    if (prescription.status === PrescriptionStatus.CANCELLED) {
      throw new BadRequestException('Cancelled prescriptions cannot be dispensed');
    }
    if (prescription.status === PrescriptionStatus.DISPENSED) {
      throw new BadRequestException('Prescription already fully dispensed');
    }

    const itemMap = new Map(prescription.items.map((i) => [i.id, i]));
    for (const row of dto.items) {
      const pi = itemMap.get(row.prescriptionItemId);
      if (!pi) {
        throw new BadRequestException('Prescription item does not belong to this prescription');
      }
      const remaining = pi.quantity - pi.dispensedQuantity;
      if (row.quantity > remaining) {
        throw new BadRequestException(
          `Requested quantity exceeds remaining for item ${pi.id}`,
        );
      }
    }

    return this.dataSource.transaction(async (manager) => {
      const dispense = manager.create(Dispense, {
        prescriptionId,
        dispensedById,
        storeId: dto.storeId,
        notes: dto.notes?.trim() ?? null,
      });
      const savedDispense = await manager.save(dispense);

      const dispenseItems: DispenseItem[] = [];
      for (const row of dto.items) {
        const pi = itemMap.get(row.prescriptionItemId)!;
        const dispenseItem = manager.create(DispenseItem, {
          dispenseId: savedDispense.id,
          prescriptionItemId: pi.id,
          quantity: row.quantity,
        });
        dispenseItems.push(dispenseItem);

        pi.dispensedQuantity += row.quantity;
        pi.status =
          pi.dispensedQuantity >= pi.quantity
            ? PrescriptionItemStatus.DISPENSED
            : PrescriptionItemStatus.PARTIAL;
        await manager.save(pi);

        await this.stockService.recordTransaction(
          {
            storeId: dto.storeId,
            itemId: pi.itemId,
            type: InventoryTransactionType.ISSUE,
            quantity: row.quantity,
            referenceType: 'prescription',
            referenceId: prescriptionId,
          },
          dispensedById,
        );
      }
      await manager.save(dispenseItems);

      const refreshed = await manager.find(PrescriptionItem, {
        where: { prescriptionId },
      });
      const allDispensed = refreshed.every((i) => i.status === PrescriptionItemStatus.DISPENSED);
      const anyDispensed = refreshed.some((i) =>
        [PrescriptionItemStatus.DISPENSED, PrescriptionItemStatus.PARTIAL].includes(i.status),
      );
      if (allDispensed) prescription.status = PrescriptionStatus.DISPENSED;
      else if (anyDispensed) prescription.status = PrescriptionStatus.PARTIALLY_DISPENSED;
      await manager.save(prescription);

      const full = await manager.findOneOrFail(Dispense, {
        where: { id: savedDispense.id },
        relations: { items: true, store: true, dispensedBy: true },
      });

      if (allDispensed && prescription.consultationId) {
        const consultation = await manager.query(
          'SELECT "visitId" FROM consultations WHERE id = $1 LIMIT 1',
          [prescription.consultationId],
        );
        const visitId: string | undefined = consultation?.[0]?.visitId;
        if (visitId) {
          await this.queueEntries.completeCurrentFor(visitId, Department.MAIN_PHARMACY);
        }
      }

      this.eventEmitter.emit(
        PrescriptionDispensedEvent.name,
        new PrescriptionDispensedEvent(prescriptionId, prescription.patientId, dispensedById),
      );
      return full;
    });
  }

  async listDispensesFor(prescriptionId: string): Promise<Dispense[]> {
    return this.dispensesRepository.find({
      where: { prescriptionId },
      relations: { items: true, store: true, dispensedBy: true },
      order: { createdAt: 'DESC' },
    });
  }
}
