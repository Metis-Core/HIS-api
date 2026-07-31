import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Gender } from 'common/enums/gender.enum';
import { BloodType } from 'src/patients/enums/blood-type.enum';
import { MaritalStatus } from 'src/patients/enums/marital-status.enum';
import { PatientStatus } from 'src/patients/enums/patient-status.enum';
import { CreatePatientDto } from './dto/create-patient.dto';
import { QueryPatientsDto } from './dto/query-patients.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { Patient } from './entities/patient.entity';

@Injectable()
export class PatientsService {
  constructor(
    @InjectRepository(Patient)
    private readonly patientsRepository: Repository<Patient>,
  ) {}

  async create(dto: CreatePatientDto): Promise<Patient> {
    const mrn = dto.mrn ?? (await this.generateMrn());
    await this.assertUniqueMrn(mrn);
    if (dto.nationalId) {
      await this.assertUniqueNationalId(dto.nationalId);
    }
    if (dto.userId) {
      await this.assertUniqueUserId(dto.userId);
    }

    const patient = this.patientsRepository.create({
      mrn,
      firstName: dto.firstName.trim(),
      middleName: dto.middleName?.trim() ?? null,
      lastName: dto.lastName.trim(),
      dateOfBirth: dto.dateOfBirth,
      gender: dto.gender ?? Gender.UNKNOWN,
      bloodType: dto.bloodType ?? BloodType.UNKNOWN,
      maritalStatus: dto.maritalStatus ?? MaritalStatus.UNKNOWN,
      status: dto.status ?? PatientStatus.ACTIVE,
      phone: dto.phone?.trim() ?? null,
      email: dto.email?.toLowerCase().trim() ?? null,
      nationalId: dto.nationalId?.trim() ?? null,
      addressLine1: dto.addressLine1?.trim() ?? null,
      addressLine2: dto.addressLine2?.trim() ?? null,
      city: dto.city?.trim() ?? null,
      district: dto.district?.trim() ?? null,
      country: dto.country?.trim() ?? null,
      emergencyContactName: dto.emergencyContactName?.trim() ?? null,
      emergencyContactPhone: dto.emergencyContactPhone?.trim() ?? null,
      emergencyContactRelation: dto.emergencyContactRelation?.trim() ?? null,
      allergies: dto.allergies?.trim() ?? null,
      notes: dto.notes?.trim() ?? null,
      userId: dto.userId ?? null,
    });

    const saved = await this.patientsRepository.save(patient);
    return this.findOne(saved.id);
  }

  async findAll(query: QueryPatientsDto): Promise<{
    data: Patient[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const sortBy = query.sortBy ?? 'createdAt';
    const sortOrder = query.sortOrder ?? 'DESC';
    const qb = this.patientsRepository.createQueryBuilder('patient');

    if (query.status) {
      qb.andWhere('patient.status = :status', { status: query.status });
    }
    if (query.gender) {
      qb.andWhere('patient.gender = :gender', { gender: query.gender });
    }
    if (query.bloodType) {
      qb.andWhere('patient.bloodType = :bloodType', {
        bloodType: query.bloodType,
      });
    }
    if (query.maritalStatus) {
      qb.andWhere('patient.maritalStatus = :maritalStatus', {
        maritalStatus: query.maritalStatus,
      });
    }
    if (query.mrn?.trim()) {
      qb.andWhere('UPPER(patient.mrn) = :mrn', {
        mrn: query.mrn.trim().toUpperCase(),
      });
    }
    if (query.firstName?.trim()) {
      qb.andWhere('LOWER(patient.firstName) LIKE :firstName', {
        firstName: `%${query.firstName.trim().toLowerCase()}%`,
      });
    }
    if (query.lastName?.trim()) {
      qb.andWhere('LOWER(patient.lastName) LIKE :lastName', {
        lastName: `%${query.lastName.trim().toLowerCase()}%`,
      });
    }
    if (query.phone?.trim()) {
      qb.andWhere('patient.phone LIKE :phone', {
        phone: `%${query.phone.trim()}%`,
      });
    }
    if (query.email?.trim()) {
      qb.andWhere('LOWER(patient.email) = :email', {
        email: query.email.trim().toLowerCase(),
      });
    }
    if (query.nationalId?.trim()) {
      qb.andWhere('patient.nationalId = :nationalId', {
        nationalId: query.nationalId.trim(),
      });
    }
    if (query.city?.trim()) {
      qb.andWhere('LOWER(patient.city) LIKE :city', {
        city: `%${query.city.trim().toLowerCase()}%`,
      });
    }
    if (query.district?.trim()) {
      qb.andWhere('LOWER(patient.district) LIKE :district', {
        district: `%${query.district.trim().toLowerCase()}%`,
      });
    }
    if (query.country?.trim()) {
      qb.andWhere('LOWER(patient.country) LIKE :country', {
        country: `%${query.country.trim().toLowerCase()}%`,
      });
    }
    if (query.userId) {
      qb.andWhere('patient.userId = :userId', { userId: query.userId });
    }
    if (query.hasUserAccount === true) {
      qb.andWhere('patient.userId IS NOT NULL');
    }
    if (query.hasUserAccount === false) {
      qb.andWhere('patient.userId IS NULL');
    }
    if (query.dateOfBirthFrom) {
      qb.andWhere('patient.dateOfBirth >= :dateOfBirthFrom', {
        dateOfBirthFrom: query.dateOfBirthFrom,
      });
    }
    if (query.dateOfBirthTo) {
      qb.andWhere('patient.dateOfBirth <= :dateOfBirthTo', {
        dateOfBirthTo: query.dateOfBirthTo,
      });
    }
    if (query.createdFrom) {
      qb.andWhere('patient.createdAt >= :createdFrom', {
        createdFrom: query.createdFrom,
      });
    }
    if (query.createdTo) {
      qb.andWhere('patient.createdAt <= :createdTo', {
        createdTo: query.createdTo,
      });
    }

    if (query.q?.trim()) {
      const term = `%${query.q.trim().toLowerCase()}%`;
      qb.andWhere(
        `(
          LOWER(patient.mrn) LIKE :term OR
          LOWER(patient.firstName) LIKE :term OR
          LOWER(patient.lastName) LIKE :term OR
          LOWER(CONCAT(patient.firstName, ' ', patient.lastName)) LIKE :term OR
          LOWER(COALESCE(patient.phone, '')) LIKE :term OR
          LOWER(COALESCE(patient.email, '')) LIKE :term OR
          LOWER(COALESCE(patient.nationalId, '')) LIKE :term
        )`,
        { term },
      );
    }

    qb.orderBy(`patient.${sortBy}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  async findById(id: string): Promise<Patient | null> {
    return this.patientsRepository.findOne({ where: { id } });
  }

  async findByMrn(mrn: string): Promise<Patient> {
    const patient = await this.patientsRepository.findOne({
      where: { mrn: mrn.trim().toUpperCase() },
    });
    if (!patient) {
      throw new NotFoundException('Patient not found');
    }
    return patient;
  }

  async findByNationalId(nationalId: string): Promise<Patient> {
    const patient = await this.patientsRepository.findOne({
      where: { nationalId: nationalId.trim() },
    });
    if (!patient) {
      throw new NotFoundException('Patient not found');
    }
    return patient;
  }

  async findByPhone(phone: string): Promise<Patient[]> {
    return this.patientsRepository
      .createQueryBuilder('patient')
      .where('patient.phone LIKE :phone', { phone: `%${phone.trim()}%` })
      .orderBy('patient.createdAt', 'DESC')
      .getMany();
  }

  async findOne(id: string): Promise<Patient> {
    const patient = await this.findById(id);
    if (!patient) {
      throw new NotFoundException('Patient not found');
    }
    return patient;
  }

  async update(id: string, dto: UpdatePatientDto): Promise<Patient> {
    const patient = await this.findOne(id);

    if (dto.mrn !== undefined && dto.mrn !== patient.mrn) {
      await this.assertUniqueMrn(dto.mrn, id);
      patient.mrn = dto.mrn;
    }

    if (dto.nationalId !== undefined) {
      const nextNationalId = dto.nationalId?.trim() || null;
      if (nextNationalId && nextNationalId !== patient.nationalId) {
        await this.assertUniqueNationalId(nextNationalId, id);
      }
      patient.nationalId = nextNationalId;
    }

    if (dto.userId !== undefined) {
      if (dto.userId && dto.userId !== patient.userId) {
        await this.assertUniqueUserId(dto.userId, id);
      }
      patient.userId = dto.userId;
    }

    if (dto.firstName !== undefined) patient.firstName = dto.firstName.trim();
    if (dto.middleName !== undefined) {
      patient.middleName = dto.middleName?.trim() || null;
    }
    if (dto.lastName !== undefined) patient.lastName = dto.lastName.trim();
    if (dto.dateOfBirth !== undefined) patient.dateOfBirth = dto.dateOfBirth;
    if (dto.gender !== undefined) patient.gender = dto.gender;
    if (dto.bloodType !== undefined) patient.bloodType = dto.bloodType;
    if (dto.maritalStatus !== undefined) {
      patient.maritalStatus = dto.maritalStatus;
    }
    if (dto.status !== undefined) patient.status = dto.status;
    if (dto.phone !== undefined) patient.phone = dto.phone?.trim() || null;
    if (dto.email !== undefined) {
      patient.email = dto.email?.toLowerCase().trim() || null;
    }
    if (dto.addressLine1 !== undefined) {
      patient.addressLine1 = dto.addressLine1?.trim() || null;
    }
    if (dto.addressLine2 !== undefined) {
      patient.addressLine2 = dto.addressLine2?.trim() || null;
    }
    if (dto.city !== undefined) patient.city = dto.city?.trim() || null;
    if (dto.district !== undefined) {
      patient.district = dto.district?.trim() || null;
    }
    if (dto.country !== undefined) {
      patient.country = dto.country?.trim() || null;
    }
    if (dto.emergencyContactName !== undefined) {
      patient.emergencyContactName = dto.emergencyContactName?.trim() || null;
    }
    if (dto.emergencyContactPhone !== undefined) {
      patient.emergencyContactPhone = dto.emergencyContactPhone?.trim() || null;
    }
    if (dto.emergencyContactRelation !== undefined) {
      patient.emergencyContactRelation =
        dto.emergencyContactRelation?.trim() || null;
    }
    if (dto.allergies !== undefined) {
      patient.allergies = dto.allergies?.trim() || null;
    }
    if (dto.notes !== undefined) patient.notes = dto.notes?.trim() || null;

    await this.patientsRepository.save(patient);
    return this.findOne(id);
  }

  async remove(id: string): Promise<Patient> {
    const patient = await this.findOne(id);
    patient.status = PatientStatus.INACTIVE;
    return this.patientsRepository.save(patient);
  }

  private async generateMrn(): Promise<string> {
    const now = new Date();
    const stamp = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0'),
    ].join('');

    for (let attempt = 0; attempt < 12; attempt += 1) {
      const suffix = String(Math.floor(1000 + Math.random() * 9000));
      const mrn = `PAT-${stamp}-${suffix}`;
      const exists = await this.patientsRepository.exists({ where: { mrn } });
      if (!exists) {
        return mrn;
      }
    }

    throw new ConflictException('Unable to generate a unique MRN');
  }

  private async assertUniqueMrn(mrn: string, excludeId?: string): Promise<void> {
    const existing = await this.patientsRepository.findOne({ where: { mrn } });
    if (existing && existing.id !== excludeId) {
      throw new ConflictException('MRN already in use');
    }
  }

  private async assertUniqueNationalId(
    nationalId: string,
    excludeId?: string,
  ): Promise<void> {
    const existing = await this.patientsRepository.findOne({
      where: { nationalId },
    });
    if (existing && existing.id !== excludeId) {
      throw new ConflictException('National ID already in use');
    }
  }

  private async assertUniqueUserId(
    userId: string,
    excludeId?: string,
  ): Promise<void> {
    const existing = await this.patientsRepository.findOne({
      where: { userId },
    });
    if (existing && existing.id !== excludeId) {
      throw new ConflictException('User is already linked to another patient');
    }
  }
}
