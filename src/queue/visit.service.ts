import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DeepPartial, Repository } from 'typeorm';
import { PatientsService } from 'src/patients/patients.service';
import { CreateVisitDTO } from './dto/create-visit.dto';
import { QueueEntry } from './entities/queue-entry.entity';
import { Visit } from './entities/visit.entity';
import { QueueEntryStatus } from './enums/queue-entry-status.enum';
import { intentDepartmentMap } from './intent-department.map';
import { BaseCrudService } from '../../common/services/crud.service';

@Injectable()
export class VisitsService extends BaseCrudService<Visit> {
  constructor(
    @InjectRepository(Visit)
    private readonly visitsRepository: Repository<Visit>,
    @InjectRepository(QueueEntry)
    private readonly queueEntriesRepository: Repository<QueueEntry>,
    private readonly patientsService: PatientsService,
    private readonly events: EventEmitter2,
  ) {
    super(visitsRepository)
  }

  override async create(entity: CreateVisitDTO & { handler: string }): Promise<Visit> {
    const { patientId, intent, visitType, handler } = entity

    if (!handler) {
      throw new NotFoundException('Handler ID is required')
    }
    if (!patientId || !(await this.patientsService.findByStringId(patientId))) {
      throw new NotFoundException('Patient not found')
    }
    if (!intent || intent.length < 1) {
      throw new BadRequestException('Visit intent is required')
    }

    const visit = await this.visitsRepository.save({
      patientId,
      checkedInById: handler,
      visitType,
      metadata: { initialIntents: intent },
    })

    const entries = intent.map((item, index) => ({
      visitId: visit.id,
      department: intentDepartmentMap[item],
      status: QueueEntryStatus.WAITING,
      priority: 5,
      sequenceNumber: index + 1,
    }))
    await this.queueEntriesRepository.save(entries)

    return visit
  }

  override async update(id: string, entity: DeepPartial<Visit>): Promise<Visit> {
    const existing = await this.findByStringId(id)
    const { metadata, ...rest } = entity
    const merged: DeepPartial<Visit> = {
      ...rest,
      metadata: { ...(existing.metadata ?? {}), ...(metadata ?? {}) } as any,
    }
    await this.visitsRepository.update({ id }, merged as any)
    return this.findByStringId(id)
  }
}
