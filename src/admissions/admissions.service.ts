import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, IsNull, Not, Repository } from 'typeorm';
import { pageWindow, toPage } from 'common/pagination';
import { IPagination } from 'common/response-format';
import { Patient } from 'src/patients/entities/patient.entity';
import { PatientType } from 'src/patients/enums/patient-type.enum';
import { AdmitPatientDTO } from './dto/admit-patient.dto';
import { DischargePatientDTO } from './dto/discharge-patient.dto';
import { QueryAdmissionsDTO } from './dto/query-admissions.dto';
import { Admission } from './entities/admission.entity';

export interface AdmissionContext {
  patientId: string;
  visitId: string | null;
  consultationId: string | null;
  admittedById: string;
}

@Injectable()
export class AdmissionsService {
  constructor(
    @InjectRepository(Admission)
    private readonly admissions: Repository<Admission>,
  ) {}

  /** Runs inside the caller's transaction so the admission and the signed consultation commit together. */
  async admit(
    manager: EntityManager,
    dto: AdmitPatientDTO,
    context: AdmissionContext,
  ): Promise<Admission> {
    if (
      context.visitId &&
      (await manager.existsBy(Admission, { visitId: context.visitId }))
    ) {
      throw new ConflictException(
        'The patient is already admitted for this visit',
      );
    }
    const patient = await manager.findOneByOrFail(Patient, {
      id: context.patientId,
    });
    patient.type = PatientType.INPATIENT;
    await manager.save(patient);
    return manager.save(
      manager.create(Admission, {
        ...context,
        ward: dto.ward,
        reason: dto.reason,
        admittedAt: new Date(),
      }),
    );
  }

  /** Ends the stay and frees the patient for a new visit. */
  discharge(
    id: string,
    dto: DischargePatientDTO,
    actorId: string,
  ): Promise<Admission> {
    return this.admissions.manager.transaction(async (manager) => {
      const admission = await manager.findOneBy(Admission, { id });
      if (!admission) throw new NotFoundException('Admission not found');
      if (admission.dischargedAt) {
        throw new ConflictException('The patient is already discharged');
      }
      admission.dischargedAt = new Date();
      admission.dischargedById = actorId;
      admission.dischargeNotes = dto.notes ?? null;
      await manager.update(Patient, admission.patientId, {
        type: PatientType.OUTPATIENT,
      });
      return manager.save(admission);
    });
  }

  async list(query: QueryAdmissionsDTO): Promise<IPagination<Admission>> {
    const window = pageWindow(query);
    const [items, total] = await this.admissions.findAndCount({
      where: {
        ...(query.patientId && { patientId: query.patientId }),
        ...(query.visitId && { visitId: query.visitId }),
        ...(query.discharged !== undefined && {
          dischargedAt: query.discharged ? Not(IsNull()) : IsNull(),
        }),
      },
      relations: { patient: true, admittedBy: true, dischargedBy: true },
      order: { admittedAt: 'DESC', id: 'DESC' },
      skip: window.skip,
      take: window.take,
    });
    return toPage(items, total, window);
  }
}
