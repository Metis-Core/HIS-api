import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Department } from 'common/enums/department.enum';
import { PatientsService } from 'src/patients/patients.service';
import { UsersService } from 'src/users/users.service';
// import { QueueService } from 'src/queue/queue.service';
import { QueueEntry } from 'src/queue/entities/queue-entry.entity';
import { QueueEntryStatus } from 'src/queue/enums/queue-entry-status.enum';
import { CompleteConsultationDto } from './dto/complete-consultation.dto';
import { CreateConsultationDto } from './dto/create-consultation.dto';
import { QueryConsultationsDto } from './dto/query-consultations.dto';
import { UpdateConsultationDto } from './dto/update-consultation.dto';
import { Consultation } from './entities/consultation.entity';
import { ConsultationStatus } from './enums/consultation-status.enum';
import { ConsultationType } from './enums/consultation-type.enum';
import { BaseCrudService } from '../../common/services/crud.service';

@Injectable()
export class ConsultationService extends BaseCrudService<Consultation> {
  constructor(
    @InjectRepository(Consultation)
    private readonly consultationsRepository: Repository<Consultation>,
    @InjectRepository(QueueEntry)
    private readonly queueEntriesRepository: Repository<QueueEntry>,
    private readonly patientsService: PatientsService,
    private readonly usersService: UsersService,
    // private readonly queueService: QueueService,
  ) {
    super(consultationsRepository);
  }

  override async create(
    dto: CreateConsultationDto,
    currentUserId?: string,
  ): Promise<Consultation> {
    await this.patientsService.findOne(dto.patientId);

    const doctorId = dto.doctorId ?? currentUserId;
    if (!doctorId) {
      throw new BadRequestException('Doctor is required');
    }
    await this.usersService.findOne(doctorId);

    let triageId = dto.triageId ?? null;
    if (dto.visitId) {
      // const visit = await this.queueService.findVisit(dto.visitId);
      // if (visit.patientId !== dto.patientId) {
      //   throw new BadRequestException(
      //     'Visit does not belong to this patient',
      //   );
      // }
      // if (!triageId && visit.triageId) {
      //   triageId = visit.triageId;
      // }
    }

    const now = new Date();
    const consultation = this.consultationsRepository.create({
      patientId: dto.patientId,
      doctorId,
      visitId: dto.visitId ?? null,
      triageId,
      type: dto.type ?? ConsultationType.OUTPATIENT,
      status: dto.status ?? ConsultationStatus.IN_PROGRESS,
      department: dto.department ?? Department.OUTPATIENT_CLINIC,
      chiefComplaint: dto.chiefComplaint.trim(),
      historyOfPresentIllness: dto.historyOfPresentIllness?.trim() ?? null,
      examinationFindings: dto.examinationFindings?.trim() ?? null,
      assessment: dto.assessment?.trim() ?? null,
      diagnosis: dto.diagnosis?.trim() ?? null,
      icd10Codes: this.normalizeIcdCodes(dto.icd10Codes),
      plan: dto.plan?.trim() ?? null,
      notes: dto.notes?.trim() ?? null,
      followUpDate: dto.followUpDate ?? null,
      startedAt: dto.startedAt ? new Date(dto.startedAt) : now,
      completedAt:
        dto.status === ConsultationStatus.COMPLETED ? now : null,
    });

    const saved = await this.consultationsRepository.save(consultation);
    return this.findOne(saved.id);
  }

  async search(query: QueryConsultationsDto): Promise<{
    data: Consultation[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const sortBy = query.sortBy ?? 'createdAt';
    const sortOrder = query.sortOrder ?? 'DESC';

    const qb = this.consultationsRepository
      .createQueryBuilder('consultation')
      .leftJoinAndSelect('consultation.patient', 'patient')
      .leftJoinAndSelect('consultation.doctor', 'doctor');

    if (query.patientId) {
      qb.andWhere('consultation.patientId = :patientId', {
        patientId: query.patientId,
      });
    }
    if (query.doctorId) {
      qb.andWhere('consultation.doctorId = :doctorId', {
        doctorId: query.doctorId,
      });
    }
    if (query.visitId) {
      qb.andWhere('consultation.visitId = :visitId', {
        visitId: query.visitId,
      });
    }
    if (query.triageId) {
      qb.andWhere('consultation.triageId = :triageId', {
        triageId: query.triageId,
      });
    }
    if (query.status) {
      qb.andWhere('consultation.status = :status', { status: query.status });
    }
    if (query.type) {
      qb.andWhere('consultation.type = :type', { type: query.type });
    }
    if (query.department) {
      qb.andWhere('consultation.department = :department', {
        department: query.department,
      });
    }
    if (query.startedFrom) {
      qb.andWhere('consultation.startedAt >= :startedFrom', {
        startedFrom: query.startedFrom,
      });
    }
    if (query.startedTo) {
      qb.andWhere('consultation.startedAt <= :startedTo', {
        startedTo: query.startedTo,
      });
    }
    if (query.createdFrom) {
      qb.andWhere('consultation.createdAt >= :createdFrom', {
        createdFrom: query.createdFrom,
      });
    }
    if (query.createdTo) {
      qb.andWhere('consultation.createdAt <= :createdTo', {
        createdTo: query.createdTo,
      });
    }
    if (query.q?.trim()) {
      const term = `%${query.q.trim().toLowerCase()}%`;
      qb.andWhere(
        `(
          LOWER(consultation.chiefComplaint) LIKE :term OR
          LOWER(COALESCE(consultation.diagnosis, '')) LIKE :term OR
          LOWER(COALESCE(consultation.icd10Codes, '')) LIKE :term OR
          LOWER(patient.mrn) LIKE :term OR
          LOWER(patient.firstName) LIKE :term OR
          LOWER(patient.lastName) LIKE :term
        )`,
        { term },
      );
    }

    qb.orderBy(`consultation.${sortBy}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  override async findOne(id: string): Promise<Consultation> {
    const consultation = await this.consultationsRepository.findOne({
      where: { id },
      relations: {
        patient: true,
        doctor: true,
        visit: true,
        triage: true,
      },
    });
    if (!consultation) {
      throw new NotFoundException('Consultation not found');
    }
    return consultation;
  }

  async findByPatient(patientId: string): Promise<Consultation[]> {
    await this.patientsService.findOne(patientId);
    return this.consultationsRepository.find({
      where: { patientId },
      order: { createdAt: 'DESC' },
      relations: { doctor: true, visit: true, triage: true },
    });
  }

  async findByVisit(visitId: string): Promise<Consultation[]> {
    return this.consultationsRepository.find({
      where: { visitId },
      order: { createdAt: 'ASC' },
      relations: { doctor: true, patient: true, triage: true },
    });
  }

  override async update(
    id: string,
    dto: UpdateConsultationDto,
  ): Promise<Consultation> {
    const consultation = await this.findOne(id);
    if (consultation.status === ConsultationStatus.CANCELLED) {
      throw new BadRequestException('Cancelled consultation cannot be edited');
    }

    if (dto.patientId !== undefined && dto.patientId !== consultation.patientId) {
      await this.patientsService.findOne(dto.patientId);
      consultation.patientId = dto.patientId;
    }
    if (dto.doctorId !== undefined) {
      await this.usersService.findOne(dto.doctorId);
      consultation.doctorId = dto.doctorId;
    }
    if (dto.visitId !== undefined) {
      if (dto.visitId) {
        // const visit = await this.queueService.findVisit(dto.visitId);
        // if (visit.patientId !== consultation.patientId) {
        //   throw new BadRequestException(
        //     'Visit does not belong to this patient',
        //   );
        // }
      }
      consultation.visitId = dto.visitId || null;
    }
    if (dto.triageId !== undefined) {
      consultation.triageId = dto.triageId || null;
    }
    if (dto.type !== undefined) consultation.type = dto.type;
    if (dto.department !== undefined) consultation.department = dto.department;
    if (dto.status !== undefined) {
      consultation.status = dto.status;
      if (
        dto.status === ConsultationStatus.COMPLETED &&
        !consultation.completedAt
      ) {
        consultation.completedAt = new Date();
      }
    }
    if (dto.chiefComplaint !== undefined) {
      consultation.chiefComplaint = dto.chiefComplaint.trim();
    }
    if (dto.historyOfPresentIllness !== undefined) {
      consultation.historyOfPresentIllness =
        dto.historyOfPresentIllness?.trim() || null;
    }
    if (dto.examinationFindings !== undefined) {
      consultation.examinationFindings =
        dto.examinationFindings?.trim() || null;
    }
    if (dto.assessment !== undefined) {
      consultation.assessment = dto.assessment?.trim() || null;
    }
    if (dto.diagnosis !== undefined) {
      consultation.diagnosis = dto.diagnosis?.trim() || null;
    }
    if (dto.icd10Codes !== undefined) {
      consultation.icd10Codes = this.normalizeIcdCodes(dto.icd10Codes);
    }
    if (dto.plan !== undefined) {
      consultation.plan = dto.plan?.trim() || null;
    }
    if (dto.notes !== undefined) {
      consultation.notes = dto.notes?.trim() || null;
    }
    if (dto.followUpDate !== undefined) {
      consultation.followUpDate = dto.followUpDate || null;
    }
    if (dto.startedAt !== undefined) {
      consultation.startedAt = new Date(dto.startedAt);
    }

    await this.consultationsRepository.save(consultation);
    return this.findOne(id);
  }

  async complete(
    id: string,
    dto: CompleteConsultationDto,
  ): Promise<{
    consultation: Consultation;
    queueUpdate: unknown | null;
  }> {
    const consultation = await this.findOne(id);
    if (consultation.status === ConsultationStatus.CANCELLED) {
      throw new BadRequestException('Cancelled consultation cannot be completed');
    }

    if (consultation.status !== ConsultationStatus.COMPLETED) {
      consultation.status = ConsultationStatus.COMPLETED;
      consultation.completedAt = new Date();
      if (dto.notes) {
        consultation.notes = dto.notes;
      }
      await this.consultationsRepository.save(consultation);
    }

    let queueUpdate: unknown | null = null;
    if (consultation.visitId) {
      const activeEntry = await this.findActiveQueueEntryForVisit(
        consultation.visitId,
        consultation.department,
      );
      if (activeEntry) {
        // queueUpdate = await this.queueService.completeStage(
        //   activeEntry.id,
        //   {
        //     nextDepartment: dto.nextDepartment,
        //     notes: dto.notes,
        //   },
        //   consultation.doctorId,
        // );
      }
    }

    return {
      consultation: await this.findOne(id),
      queueUpdate,
    };
  }

  async cancel(id: string, reason?: string): Promise<Consultation> {
    const consultation = await this.findOne(id);
    if (consultation.status === ConsultationStatus.CANCELLED) {
      return consultation;
    }
    consultation.status = ConsultationStatus.CANCELLED;
    consultation.completedAt = consultation.completedAt ?? new Date();
    if (reason) {
      consultation.notes = reason;
    }
    await this.consultationsRepository.save(consultation);
    return this.findOne(id);
  }

  private async findActiveQueueEntryForVisit(
    visitId: string,
    department: Department,
  ): Promise<QueueEntry | null> {
    return this.queueEntriesRepository.findOne({
      where: {
        visitId,
        department,
        status: In([
          QueueEntryStatus.WAITING,
          QueueEntryStatus.CALLED,
          QueueEntryStatus.IN_SERVICE,
        ]),
      },
      order: { createdAt: 'DESC' },
    });
  }

  private normalizeIcdCodes(input?: string | null): string | null {
    if (input === undefined || input === null) return null;
    const cleaned = input
      .split(',')
      .map((c) => c.trim().toUpperCase())
      .filter(Boolean);
    return cleaned.length ? cleaned.join(',') : null;
  }
}
