import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConsciousnessLevel } from 'src/traige/enums/consciousness-level.enum';
import { TriageStatus } from 'src/traige/enums/triage-status.enum';
import { PatientsService } from 'src/patients/patients.service';
import { QueueEntriesService } from 'src/queue/queue-entries.service';
import { UsersService } from 'src/users/users.service';
import { Department } from 'common/enums/department.enum';
import { BaseCrudService } from 'common/services/crud.service';
import { CreateTriageDto } from './dto/create-traige.dto';
import { QueryTriageDto } from './dto/query-triage.dto';
import { UpdateTriageDto } from './dto/update-traige.dto';
import { Triage } from './entities/traige.entity';

@Injectable()
export class TraigeService extends BaseCrudService<Triage> {
  constructor(
    @InjectRepository(Triage)
    private readonly triageRepository: Repository<Triage>,
    private readonly patientsService: PatientsService,
    private readonly usersService: UsersService,
    private readonly queueEntries: QueueEntriesService,
  ) {
    super(triageRepository);
  }

  async createTriage(
    dto: CreateTriageDto,
    currentUserId?: string,
  ): Promise<Triage> {
    await this.patientsService.findOne(dto.patientId);

    const triagedById = dto.triagedById ?? currentUserId;
    if (!triagedById) {
      throw new NotFoundException('Triage nurse is required');
    }
    await this.usersService.findOne(triagedById);

    let queueNumber = dto.queueNumber?.trim() ?? null;
    if (dto.visitId) {
      // const visit = await this.queueService.findVisit(dto.visitId);
      // queueNumber = visit.tokenNumber;
    }

    const now = new Date();
    const triage = this.triageRepository.create({
      patientId: dto.patientId,
      triagedById,
      acuity: dto.acuity,
      status: dto.status ?? TriageStatus.WAITING,
      chiefComplaint: dto.chiefComplaint.trim(),
      assessmentNotes: dto.assessmentNotes?.trim() ?? null,
      consciousness: dto.consciousness ?? ConsciousnessLevel.UNKNOWN,
      temperatureC:
        dto.temperatureC !== undefined ? String(dto.temperatureC) : null,
      heartRate: dto.heartRate ?? null,
      respiratoryRate: dto.respiratoryRate ?? null,
      bloodPressureSystolic: dto.bloodPressureSystolic ?? null,
      bloodPressureDiastolic: dto.bloodPressureDiastolic ?? null,
      oxygenSaturation:
        dto.oxygenSaturation !== undefined
          ? String(dto.oxygenSaturation)
          : null,
      weightKg: dto.weightKg !== undefined ? String(dto.weightKg) : null,
      heightCm: dto.heightCm !== undefined ? String(dto.heightCm) : null,
      painScore: dto.painScore ?? null,
      allergiesNoted: dto.allergiesNoted?.trim() ?? null,
      referredToDepartment: dto.referredToDepartment ?? null,
      arrivedAt: dto.arrivedAt ? new Date(dto.arrivedAt) : now,
      triagedAt: dto.triagedAt ? new Date(dto.triagedAt) : now,
      completedAt: null,
      queueNumber,
    });

    const saved = await this.triageRepository.save(triage);
    const triageRecord = await this.findOne(saved.id);

    if (dto.visitId) {
      if (dto.nextIntents && dto.nextIntents.length > 0) {
        await this.queueEntries.appendIntents(dto.visitId, dto.nextIntents);
      }
      if (
        triageRecord.status === TriageStatus.COMPLETED ||
        triageRecord.status === TriageStatus.REFERRED
      ) {
        await this.syncVisitQueue(dto.visitId, triageRecord);
      }
    }

    return triageRecord;
  }

  async search(query: QueryTriageDto): Promise<{
    items: Triage[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const sortBy = query.sortBy ?? 'createdAt';
    const sortOrder = query.sortOrder ?? 'DESC';

    const qb = this.triageRepository
      .createQueryBuilder('triage')
      .leftJoinAndSelect('triage.patient', 'patient');

    if (query.patientId) {
      qb.andWhere('triage.patientId = :patientId', {
        patientId: query.patientId,
      });
    }
    if (query.triagedById) {
      qb.andWhere('triage.triagedById = :triagedById', {
        triagedById: query.triagedById,
      });
    }
    if (query.acuity) {
      qb.andWhere('triage.acuity = :acuity', { acuity: query.acuity });
    }
    if (query.status) {
      qb.andWhere('triage.status = :status', { status: query.status });
    }
    if (query.referredToDepartment) {
      qb.andWhere('triage.referredToDepartment = :referredToDepartment', {
        referredToDepartment: query.referredToDepartment,
      });
    }
    if (query.arrivedFrom) {
      qb.andWhere('triage.arrivedAt >= :arrivedFrom', {
        arrivedFrom: query.arrivedFrom,
      });
    }
    if (query.arrivedTo) {
      qb.andWhere('triage.arrivedAt <= :arrivedTo', {
        arrivedTo: query.arrivedTo,
      });
    }
    if (query.createdFrom) {
      qb.andWhere('triage.createdAt >= :createdFrom', {
        createdFrom: query.createdFrom,
      });
    }
    if (query.createdTo) {
      qb.andWhere('triage.createdAt <= :createdTo', {
        createdTo: query.createdTo,
      });
    }
    if (query.q?.trim()) {
      const term = `%${query.q.trim().toLowerCase()}%`;
      qb.andWhere(
        `(
          LOWER(triage.chiefComplaint) LIKE :term OR
          LOWER(COALESCE(triage.queueNumber, '')) LIKE :term OR
          LOWER(patient.mrn) LIKE :term OR
          LOWER(patient.firstName) LIKE :term OR
          LOWER(patient.lastName) LIKE :term
        )`,
        { term },
      );
    }

    qb.orderBy(`triage.${sortBy}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit };
  }

  async findByPatient(patientId: string): Promise<Triage[]> {
    await this.patientsService.findOne(patientId);
    return this.triageRepository.find({
      where: { patientId },
      order: { createdAt: 'DESC' },
      relations: { patient: true },
    });
  }

  async findQueue(status: TriageStatus = TriageStatus.WAITING): Promise<Triage[]> {
    return this.triageRepository
      .createQueryBuilder('triage')
      .leftJoinAndSelect('triage.patient', 'patient')
      .where('triage.status = :status', { status })
      .addOrderBy(
        `CASE triage.acuity
          WHEN 'LEVEL_1' THEN 1
          WHEN 'LEVEL_2' THEN 2
          WHEN 'LEVEL_3' THEN 3
          WHEN 'LEVEL_4' THEN 4
          WHEN 'LEVEL_5' THEN 5
          ELSE 6
        END`,
        'ASC',
      )
      .addOrderBy('triage.arrivedAt', 'ASC')
      .getMany();
  }

  override async findOne(id: string): Promise<Triage> {
    const triage = await this.triageRepository.findOne({
      where: { id },
      relations: { patient: true, triagedBy: true },
    });
    if (!triage) {
      throw new NotFoundException('Triage record not found');
    }
    return triage;
  }

  async updateTriage(id: string, dto: UpdateTriageDto): Promise<Triage> {
    const triage = await this.findOne(id);

    if (dto.patientId !== undefined && dto.patientId !== triage.patientId) {
      await this.patientsService.findOne(dto.patientId);
      triage.patientId = dto.patientId;
    }
    if (dto.triagedById !== undefined) {
      await this.usersService.findOne(dto.triagedById);
      triage.triagedById = dto.triagedById;
    }
    if (dto.acuity !== undefined) triage.acuity = dto.acuity;
    if (dto.status !== undefined) {
      triage.status = dto.status;
      if (
        dto.status === TriageStatus.COMPLETED ||
        dto.status === TriageStatus.REFERRED
      ) {
        triage.completedAt = triage.completedAt ?? new Date();
      }
    }
    if (dto.chiefComplaint !== undefined) {
      triage.chiefComplaint = dto.chiefComplaint.trim();
    }
    if (dto.assessmentNotes !== undefined) {
      triage.assessmentNotes = dto.assessmentNotes?.trim() || null;
    }
    if (dto.consciousness !== undefined) {
      triage.consciousness = dto.consciousness;
    }
    if (dto.temperatureC !== undefined) {
      triage.temperatureC =
        dto.temperatureC === null ? null : String(dto.temperatureC);
    }
    if (dto.heartRate !== undefined) triage.heartRate = dto.heartRate;
    if (dto.respiratoryRate !== undefined) {
      triage.respiratoryRate = dto.respiratoryRate;
    }
    if (dto.bloodPressureSystolic !== undefined) {
      triage.bloodPressureSystolic = dto.bloodPressureSystolic;
    }
    if (dto.bloodPressureDiastolic !== undefined) {
      triage.bloodPressureDiastolic = dto.bloodPressureDiastolic;
    }
    if (dto.oxygenSaturation !== undefined) {
      triage.oxygenSaturation =
        dto.oxygenSaturation === null ? null : String(dto.oxygenSaturation);
    }
    if (dto.weightKg !== undefined) {
      triage.weightKg = dto.weightKg === null ? null : String(dto.weightKg);
    }
    if (dto.heightCm !== undefined) {
      triage.heightCm = dto.heightCm === null ? null : String(dto.heightCm);
    }
    if (dto.painScore !== undefined) triage.painScore = dto.painScore;
    if (dto.allergiesNoted !== undefined) {
      triage.allergiesNoted = dto.allergiesNoted?.trim() || null;
    }
    if (dto.referredToDepartment !== undefined) {
      triage.referredToDepartment = dto.referredToDepartment;
    }
    if (dto.arrivedAt !== undefined) {
      triage.arrivedAt = new Date(dto.arrivedAt);
    }
    if (dto.triagedAt !== undefined) {
      triage.triagedAt = dto.triagedAt ? new Date(dto.triagedAt) : null;
    }
    if (dto.completedAt !== undefined) {
      triage.completedAt = dto.completedAt ? new Date(dto.completedAt) : null;
    }
    if (dto.queueNumber !== undefined) {
      triage.queueNumber = dto.queueNumber?.trim() || null;
    }

    await this.triageRepository.save(triage);
    const updated = await this.findOne(id);

    if (dto.visitId) {
      if (dto.nextIntents && dto.nextIntents.length > 0) {
        await this.queueEntries.appendIntents(dto.visitId, dto.nextIntents);
      }
      if (
        updated.status === TriageStatus.COMPLETED ||
        updated.status === TriageStatus.REFERRED
      ) {
        await this.syncVisitQueue(dto.visitId, updated);
      }
    }

    return updated;
  }

  async cancel(id: string): Promise<Triage> {
    const triage = await this.findOne(id);
    triage.status = TriageStatus.CANCELLED;
    triage.completedAt = triage.completedAt ?? new Date();
    return this.triageRepository.save(triage);
  }

  private async syncVisitQueue(visitId: string, triage: Triage): Promise<void> {
    await this.queueEntries.completeCurrentFor(visitId, Department.TRIAGE);
  }
}
