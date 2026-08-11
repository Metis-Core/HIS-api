import {
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
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
import { Patient } from './entities/patient.entity';
import { ContactsService } from '../contacts/contacts.service';
import { BaseCrudService } from '../../common/services/crud.service';
import { IPagination } from '../../common/response-format';

@Injectable()
export class PatientsService extends BaseCrudService<Patient> {
  constructor(
    @InjectRepository(Patient)
    private readonly patientsRepository: Repository<Patient>,
    private readonly contactService: ContactsService
  ) {
    super(patientsRepository)
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

    return patient;
  }

  async search(query: PatientFiltersDto): Promise<IPagination<Patient>> {
    const { page = 1, limit = 20, createdAt = 'createdAt', sortOrder = 'DESC', ...filters } = query;

    return this.findManyWithPagination({
      where: this.buildWhere(filters as any),
      // order: { [sortBy]: sortOrder } as FindOptionsOrder<Patient>,
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  private buildWhere(
    filters: PatientFiltersDto,
  ): FindOptionsWhere<Patient> | FindOptionsWhere<Patient>[] {
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

    // if (filters.createdFrom && filters.createdTo) {
    //   base.createdAt = Between(new Date(filters.createdFrom), new Date(filters.createdTo));
    // } else if (filters.createdFrom) {
    //   base.createdAt = MoreThanOrEqual(new Date(filters.createdFrom));
    // } else if (filters.createdTo) {
    //   base.createdAt = LessThanOrEqual(new Date(filters.createdTo));
    // }

    return base;
  }
}
