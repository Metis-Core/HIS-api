import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from 'common/enums/department.enum';
import { BaseCrudService } from 'common/services/crud.service';
import { PatientsService } from 'src/patients/patients.service';
import { Visit } from 'src/queue/entities/visit.entity';
import { UsersService } from 'src/users/users.service';
import { encounterChanges } from './consultation-encounter.mapper';
import { CreateConsultationDto } from './dto/create-consultation.dto';
import { UpdateConsultationDto } from './dto/update-consultation.dto';
import { Consultation } from './entities/consultation.entity';
import { ConsultationStatus } from './enums/consultation-status.enum';
import { ConsultationType } from './enums/consultation-type.enum';

@Injectable()
export class ConsultationService extends BaseCrudService<Consultation> {
  constructor(
    @InjectRepository(Consultation)
    private readonly consultationsRepository: Repository<Consultation>,
    @InjectRepository(Visit)
    private readonly visitsRepository: Repository<Visit>,
    private readonly patientsService: PatientsService,
    private readonly usersService: UsersService,
  ) {
    super(consultationsRepository);
  }

  override async create(
    dto: CreateConsultationDto,
    currentUserId?: string,
  ): Promise<Consultation> {
    await this.patientsService.findOne(dto.patientId);
    const doctorId = dto.doctorId ?? currentUserId;
    if (!doctorId) throw new BadRequestException('Doctor is required');
    await this.usersService.findOne(doctorId);
    if (dto.visitId)
      await this.assertVisitOfPatient(dto.visitId, dto.patientId);

    const now = new Date();
    const consultation = this.consultationsRepository.create({
      ...encounterChanges(dto),
      patientId: dto.patientId,
      doctorId,
      visitId: dto.visitId ?? null,
      triageId: dto.triageId ?? null,
      type: dto.type ?? ConsultationType.OUTPATIENT,
      status: dto.status ?? ConsultationStatus.IN_PROGRESS,
      department: dto.department ?? Department.OUTPATIENT_CLINIC,
      chiefComplaint: dto.chiefComplaint.trim(),
      followUpDate: dto.followUpDate ?? null,
      startedAt: dto.startedAt ? new Date(dto.startedAt) : now,
      completedAt: dto.status === ConsultationStatus.COMPLETED ? now : null,
    });
    const saved = await this.consultationsRepository.save(consultation);
    return this.findOne(saved.id);
  }

  override async findOne(id: string): Promise<Consultation> {
    const consultation = await this.consultationsRepository.findOne({
      where: { id },
      relations: { patient: true, doctor: true, visit: true, triage: true },
    });
    if (!consultation) throw new NotFoundException('Consultation not found');
    return consultation;
  }

  override async update(
    id: string,
    dto: UpdateConsultationDto,
  ): Promise<Consultation> {
    const consultation = await this.findOne(id);
    if (consultation.status === ConsultationStatus.CANCELLED) {
      throw new BadRequestException('Cancelled consultation cannot be edited');
    }
    if (
      dto.patientId !== undefined &&
      dto.patientId !== consultation.patientId
    ) {
      await this.patientsService.findOne(dto.patientId);
      consultation.patientId = dto.patientId;
    }
    if (dto.doctorId !== undefined) {
      await this.usersService.findOne(dto.doctorId);
      consultation.doctorId = dto.doctorId;
    }
    if (dto.visitId)
      await this.assertVisitOfPatient(dto.visitId, consultation.patientId);
    if (dto.visitId !== undefined) consultation.visitId = dto.visitId || null;
    if (dto.triageId !== undefined)
      consultation.triageId = dto.triageId || null;
    if (
      dto.status === ConsultationStatus.COMPLETED &&
      !consultation.completedAt
    ) {
      consultation.completedAt = new Date();
    }
    if (dto.chiefComplaint !== undefined)
      consultation.chiefComplaint = dto.chiefComplaint.trim();
    if (dto.followUpDate !== undefined)
      consultation.followUpDate = dto.followUpDate || null;
    if (dto.startedAt !== undefined)
      consultation.startedAt = new Date(dto.startedAt);
    Object.assign(consultation, encounterChanges(dto), {
      type: dto.type ?? consultation.type,
      department: dto.department ?? consultation.department,
      status: dto.status ?? consultation.status,
    });
    await this.consultationsRepository.save(consultation);
    return this.findOne(id);
  }

  private async assertVisitOfPatient(
    visitId: string,
    patientId: string,
  ): Promise<void> {
    const visit = await this.visitsRepository.findOne({
      where: { id: visitId },
      select: { id: true, patientId: true },
    });
    if (!visit) throw new NotFoundException('Visit not found');
    if (visit.patientId !== patientId) {
      throw new BadRequestException('Visit does not belong to this patient');
    }
  }
}
