import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  Between,
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
import { IPagination } from '../../common/response-format';

@Injectable()
export class PatientsService extends BaseCrudService<Patient> {
  constructor(
    @InjectRepository(Patient)
    private readonly patientsRepository: Repository<Patient>,
    private readonly contactService: ContactsService,
    private readonly events: EventEmitter2,
  ) {
    super(patientsRepository)
  }

  private emit(event: PatientEvent): void {
    this.events.emit(event.channel, event);
  }

  override async findOne(id: string): Promise<Patient> {
    const patient = await this.patientsRepository.findOne({
      where: { id },
      relations: { contact: true },
    });
    if (!patient) {
      throw new NotFoundException(`Patient with ID ${id} not found`);
    }
    return patient;
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
      await this.contactService.create({ patientId: patient.id, ...emergencyContact });
    }

    this.emit(new PatientCreatedEvent(toPatientEventData(patient)));
    return patient;
  }

  override async update(
    id: string,
    dto: UpdatePatientDto,
  ): Promise<Patient> {
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
    const { page = 1, limit = 20, sortOrder = 'DESC', search, ...filters } = query;
    const base = this.buildWhere(filters);
    const term = search?.trim();

    return this.findManyWithPagination({
      where: term ? this.withSearch(base, term) : base,
      order: { createdAt: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
      relations: { contact: true },
    });
  }

  private withSearch(
    base: FindOptionsWhere<Patient>,
    term: string,
  ): FindOptionsWhere<Patient>[] {
    const like = ILike(`%${term}%`);
    const fields: (keyof Patient)[] = [
      'firstName',
      'middleName',
      'lastName',
      'mrn',
      'phone',
      'email',
      'nationalId',
    ];
    return fields.map((field) => ({ ...base, [field]: like }));
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
    if (filters.city?.trim()) base.city = ILike(`%${filters.city.trim()}%`);

    if (filters.dateOfBirthFrom && filters.dateOfBirthTo) {
      base.dateOfBirth = Between(filters.dateOfBirthFrom, filters.dateOfBirthTo);
    } else if (filters.dateOfBirthFrom) {
      base.dateOfBirth = MoreThanOrEqual(filters.dateOfBirthFrom);
    } else if (filters.dateOfBirthTo) {
      base.dateOfBirth = LessThanOrEqual(filters.dateOfBirthTo);
    }

    return base;
  }
}
