import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  Between,
  Brackets,
  FindOptionsWhere,
  ILike,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { CreatePatientDto } from './dto/create-patient.dto';
import { PatientFiltersDto } from './dto/patient-filters.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { Patient } from './entities/patient.entity';
import {
  PatientCreatedEvent,
  PatientDeletedEvent,
  PatientEvent,
  PatientStatusChangedEvent,
  PatientUpdatedEvent,
  toPatientEventData,
} from './events/patient.events';
import { ContactsService } from '../contacts/contacts.service';
import { BaseCrudService } from '../../common/services/crud.service';
import { buildPaginationMeta, IPagination } from '../../common/response-format';
import { containsPattern } from '../../common/utils/like-pattern';

const SEARCHABLE_FIELDS = [
  'firstName',
  'middleName',
  'lastName',
  'mrn',
  'phone',
  'email',
  'nationalId',
] as const;

@Injectable()
export class PatientsService extends BaseCrudService<Patient> {
  constructor(
    @InjectRepository(Patient)
    private readonly patientsRepository: Repository<Patient>,
    private readonly contactService: ContactsService,
    private readonly events: EventEmitter2,
  ) {
    super(patientsRepository);
  }

  private emit(event: PatientEvent): void {
    this.events.emit(event.channel, event);
  }

  override async create(entity: CreatePatientDto): Promise<Patient> {
    const { emergencyContact, ...rest } = entity;

    if (rest.phone || rest.email || rest.nationalId) {
      const duplicate = await this.patientsRepository.findOne({
        where: [
          ...(rest.phone ? [{ phone: rest.phone }] : []),
          ...(rest.email ? [{ email: rest.email }] : []),
          ...(rest.nationalId ? [{ nationalId: rest.nationalId }] : []),
        ],
      });
      if (duplicate) {
        throw new ConflictException(
          'Patient already exists with this phone, email, or national ID',
        );
      }
    }

    const patient = await this.patientsRepository.save(
      this.patientsRepository.create(rest),
    );

    if (emergencyContact) {
      await this.contactService.create({
        patientId: patient.id,
        ...emergencyContact,
      });
    }

    this.emit(new PatientCreatedEvent(toPatientEventData(patient)));
    return patient;
  }

  override async update(id: string, dto: UpdatePatientDto): Promise<Patient> {
    const existing = await this.findOne(id);
    const { emergencyContact, ...rest } = dto;
    await super.update(id, rest);
    if (emergencyContact) {
      await this.contactService.upsertForPatient(id, emergencyContact);
    }
    const updated = await this.findOne(id);

    this.emit(new PatientUpdatedEvent(toPatientEventData(updated)));
    if (dto.status && dto.status !== existing.status) {
      this.emit(
        new PatientStatusChangedEvent(
          toPatientEventData(updated),
          existing.status,
        ),
      );
    }

    return updated;
  }

  override async remove(id: string): Promise<void> {
    const patient = await this.findOne(id);
    await super.remove(id);
    this.emit(new PatientDeletedEvent(toPatientEventData(patient)));
  }

  async search(query: PatientFiltersDto): Promise<IPagination<Patient>> {
    const {
      page = 1,
      limit = 20,
      sortOrder = 'DESC',
      search,
      ...filters
    } = query;
    const skip = (page - 1) * limit;
    const qb = this.patientsRepository
      .createQueryBuilder('patient')
      .leftJoinAndSelect('patient.contact', 'contact')
      .where(this.buildWhere(filters))
      .orderBy('patient.createdAt', sortOrder)
      .skip(skip)
      .take(limit);

    // Every word must match some identifying field, so "jane nakato" finds Jane Nakato.
    const words = search?.trim().split(/\s+/).filter(Boolean) ?? [];
    words.forEach((word, index) => {
      const param = `term${index}`;
      qb.andWhere(
        new Brackets((sub) => {
          SEARCHABLE_FIELDS.forEach((field) =>
            sub.orWhere(`patient.${field} ILIKE :${param}`, {
              [param]: containsPattern(word),
            }),
          );
        }),
      );
    });

    const [items, total] = await qb.getManyAndCount();
    return { items, total, meta: buildPaginationMeta(total, skip, limit) };
  }

  private buildWhere(
    filters: Partial<PatientFiltersDto>,
  ): FindOptionsWhere<Patient> {
    const base: FindOptionsWhere<Patient> = {};

    if (filters.status) base.status = filters.status;
    if (filters.type) base.type = filters.type;
    if (filters.gender) base.gender = filters.gender;
    if (filters.bloodType) base.bloodType = filters.bloodType;
    if (filters.maritalStatus) base.maritalStatus = filters.maritalStatus;
    if (filters.city?.trim())
      base.city = ILike(containsPattern(filters.city.trim()));

    if (filters.dateOfBirthFrom && filters.dateOfBirthTo) {
      base.dateOfBirth = Between(
        filters.dateOfBirthFrom,
        filters.dateOfBirthTo,
      );
    } else if (filters.dateOfBirthFrom) {
      base.dateOfBirth = MoreThanOrEqual(filters.dateOfBirthFrom);
    } else if (filters.dateOfBirthTo) {
      base.dateOfBirth = LessThanOrEqual(filters.dateOfBirthTo);
    }

    const createdAt = this.dateRange(
      filters.registeredFrom,
      filters.registeredTo,
    );
    if (createdAt) base.createdAt = createdAt;

    return base;
  }

  private dateRange(from?: string, to?: string) {
    const start = from
      ? new Date(`${from.slice(0, 10)}T00:00:00.000Z`)
      : undefined;
    const end = to ? new Date(`${to.slice(0, 10)}T23:59:59.999Z`) : undefined;
    if (start && end) return Between(start, end);
    if (start) return MoreThanOrEqual(start);
    if (end) return LessThanOrEqual(end);
    return undefined;
  }
}
