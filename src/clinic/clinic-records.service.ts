import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { pageWindow, toPage } from 'common/pagination';
import { containsPattern } from 'common/utils/like-pattern';
import { IPagination } from 'common/response-format';
import { interpretResult } from 'src/lab/results/interpret-result';
import { patientContext } from 'src/lab/results/patient-context';
import { validateResultData } from 'src/lab/results/validate-result-data';
import { Patient } from 'src/patients/entities/patient.entity';
import { Visit } from 'src/queue/entities/visit.entity';
import { CreateClinicRecordDto } from './dto/create-clinic-record.dto';
import { QueryClinicRecordsDto } from './dto/query-clinic-records.dto';
import { ClinicRecord } from './entities/clinic-record.entity';
import { ClinicRecordKind } from './enums/clinic-record-kind.enum';
import { ClinicRecordCreatedEvent } from './events/clinic-record-created.event';
import { CLINIC_TEMPLATES } from './templates';
import { findVaccine } from './vaccines';

@Injectable()
export class ClinicRecordsService {
  constructor(
    @InjectRepository(ClinicRecord)
    private readonly records: Repository<ClinicRecord>,
    @InjectRepository(Patient)
    private readonly patients: Repository<Patient>,
    @InjectRepository(Visit)
    private readonly visits: Repository<Visit>,
    private readonly events: EventEmitter2,
  ) {}

  async create(
    dto: CreateClinicRecordDto,
    recordedById: string,
  ): Promise<ClinicRecord> {
    const patient = await this.patients.findOneBy({ id: dto.patientId });
    if (!patient) throw new NotFoundException('Patient not found');
    if (
      dto.visitId &&
      !(await this.visits.existsBy({
        id: dto.visitId,
        patientId: dto.patientId,
      }))
    ) {
      throw new BadRequestException(
        'The visit does not belong to this patient',
      );
    }
    const schema = CLINIC_TEMPLATES[dto.kind];
    const data = validateResultData(schema, dto.data, {
      requireComplete: true,
    });
    const flags = interpretResult(
      schema,
      data,
      patientContext(patient, new Date()),
    );
    const saved = await this.records.save(
      this.records.create({
        patientId: dto.patientId,
        visitId: dto.visitId ?? null,
        kind: dto.kind,
        data,
        flags,
        recordedById,
      }),
    );
    this.events.emit(
      ClinicRecordCreatedEvent.channel,
      new ClinicRecordCreatedEvent(
        saved.id,
        saved.kind,
        saved.patientId,
        saved.visitId,
        recordedById,
        dto.kind === ClinicRecordKind.IMMUNIZATION
          ? (findVaccine(data.vaccine)?.serviceCode ?? null)
          : null,
      ),
    );
    return saved;
  }

  async list(query: QueryClinicRecordsDto): Promise<IPagination<ClinicRecord>> {
    const window = pageWindow(query);
    const qb = this.records
      .createQueryBuilder('record')
      .leftJoinAndSelect('record.patient', 'patient')
      .leftJoinAndSelect('record.recordedBy', 'recordedBy')
      .orderBy('record.createdAt', 'DESC')
      .addOrderBy('record.id', 'DESC')
      .skip(window.skip)
      .take(window.take);
    if (query.patientId) {
      qb.andWhere('record.patientId = :patientId', {
        patientId: query.patientId,
      });
    }
    if (query.visitId) {
      qb.andWhere('record.visitId = :visitId', { visitId: query.visitId });
    }
    if (query.kind) qb.andWhere('record.kind = :kind', { kind: query.kind });
    if (query.from) {
      qb.andWhere('record.createdAt >= :from', { from: query.from });
    }
    if (query.to) {
      qb.andWhere(`record.createdAt < (:to::date + interval '1 day')`, {
        to: query.to,
      });
    }
    const words = query.search?.split(/\s+/).filter(Boolean) ?? [];
    words.forEach((word, index) => {
      const param = `term${index}`;
      qb.andWhere(
        new Brackets((sub) => {
          for (const field of ['firstName', 'lastName', 'mrn']) {
            sub.orWhere(`patient.${field} ILIKE :${param}`, {
              [param]: containsPattern(word),
            });
          }
        }),
      );
    });
    const [items, total] = await qb.getManyAndCount();
    return toPage(items, total, window);
  }
}
