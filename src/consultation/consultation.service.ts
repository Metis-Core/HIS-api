import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from 'common/enums/department.enum';
import { BaseCrudService } from 'common/services/crud.service';
import {
  ConsultationActor,
  assertCanEditConsultation,
} from './consultation-access.policy';
import { ConsultationDiagnosesService } from './consultation-diagnoses.service';
import {
  encounterChanges,
  headerChanges,
} from './consultation-encounter.mapper';
import { assertOpenForEditing } from './consultation-lock.policy';
import { ConsultationReferencesService } from './consultation-references.service';
import { ConsultationDiagnosisDTO } from './dto/consultation-diagnosis.dto';
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
    private readonly references: ConsultationReferencesService,
    private readonly diagnoses: ConsultationDiagnosesService,
  ) {
    super(consultationsRepository);
  }

  async open(
    dto: CreateConsultationDto,
    actor: ConsultationActor,
  ): Promise<Consultation> {
    await this.references.assertPatient(dto.patientId);
    const doctorId = dto.doctorId ?? actor.id;
    await this.references.assertAssignableDoctor(doctorId, actor);
    if (dto.visitId) {
      await this.references.assertVisitOfPatient(dto.visitId, dto.patientId);
    }
    const consultation = this.consultationsRepository.create({
      ...encounterChanges(dto),
      ...headerChanges(dto),
      patientId: dto.patientId,
      doctorId,
      visitId: dto.visitId ?? null,
      triageId: dto.triageId ?? null,
      type: dto.type ?? ConsultationType.OUTPATIENT,
      status: ConsultationStatus.IN_PROGRESS,
      department: dto.department ?? Department.OUTPATIENT_CLINIC,
      startedAt: dto.startedAt ? new Date(dto.startedAt) : new Date(),
      completedAt: null,
    });
    const saved = await this.persist(consultation, dto.diagnoses);
    return this.findOne(saved.id);
  }

  override async findOne(id: string): Promise<Consultation> {
    const consultation = await this.consultationsRepository.findOne({
      where: { id },
      relations: {
        patient: true,
        doctor: true,
        visit: true,
        triage: true,
        diagnoses: true,
      },
      order: { diagnoses: { rank: 'ASC' } },
    });
    if (!consultation) throw new NotFoundException('Consultation not found');
    return consultation;
  }

  /** Loads a consultation the actor may change (M-11). */
  async findEditable(
    id: string,
    actor: ConsultationActor,
  ): Promise<Consultation> {
    const consultation = await this.findOne(id);
    assertCanEditConsultation(consultation, actor);
    return consultation;
  }

  async edit(
    id: string,
    dto: UpdateConsultationDto,
    actor: ConsultationActor,
  ): Promise<Consultation> {
    const consultation = await this.findEditable(id, actor);
    assertOpenForEditing(consultation);
    if (dto.patientId && dto.patientId !== consultation.patientId) {
      await this.references.assertPatient(dto.patientId);
      consultation.patientId = dto.patientId;
    }
    if (dto.doctorId && dto.doctorId !== consultation.doctorId) {
      await this.references.assertAssignableDoctor(dto.doctorId, actor);
      consultation.doctorId = dto.doctorId;
    }
    if (dto.visitId) {
      await this.references.assertVisitOfPatient(
        dto.visitId,
        consultation.patientId,
      );
    }
    if (dto.visitId !== undefined) consultation.visitId = dto.visitId || null;
    if (dto.triageId !== undefined) {
      consultation.triageId = dto.triageId || null;
    }
    Object.assign(consultation, encounterChanges(dto), headerChanges(dto), {
      type: dto.type ?? consultation.type,
      department: dto.department ?? consultation.department,
    });
    await this.persist(consultation, dto.diagnoses);
    return this.findOne(id);
  }

  // Codes are checked before anything is written, then the encounter and its diagnoses save together.
  private async persist(
    consultation: Consultation,
    diagnoses?: ConsultationDiagnosisDTO[],
  ): Promise<Consultation> {
    const rows = diagnoses ? await this.diagnoses.resolve(diagnoses) : null;
    return this.consultationsRepository.manager.transaction(async (manager) => {
      // Diagnoses are replaced below; a stale loaded list must not be diffed by the save.
      consultation.diagnoses = undefined;
      const saved = await manager.save(consultation);
      if (rows) await this.diagnoses.replace(manager, saved.id, rows);
      return saved;
    });
  }
}
