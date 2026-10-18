import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { pageWindow, toPage } from 'common/pagination';
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
    const [items, total] = await this.records.findAndCount({
      where: {
        ...(query.patientId && { patientId: query.patientId }),
        ...(query.visitId && { visitId: query.visitId }),
        ...(query.kind && { kind: query.kind }),
      },
      relations: { recordedBy: true },
      order: { createdAt: 'DESC', id: 'DESC' },
      skip: window.skip,
      take: window.take,
    });
    return toPage(items, total, window);
  }
}
