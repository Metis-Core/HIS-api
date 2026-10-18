import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IPagination } from 'common/response-format';
import { PaginationQueryDTO, pageWindow, toPage } from 'common/pagination';
import { PatientsService } from 'src/patients/patients.service';
import { applyConsultationFilters } from './consultation-filters';
import { QueryConsultationsDto } from './dto/query-consultations.dto';
import { Consultation } from './entities/consultation.entity';

/** Read-side lists of consultations: search, patient history and per-visit. */
@Injectable()
export class ConsultationQueryService {
  constructor(
    @InjectRepository(Consultation)
    private readonly consultationsRepository: Repository<Consultation>,
    private readonly patientsService: PatientsService,
  ) {}

  async search(
    query: QueryConsultationsDto,
  ): Promise<IPagination<Consultation>> {
    const window = pageWindow(query);
    const sortOrder = query.sortOrder ?? 'DESC';
    const qb = this.consultationsRepository
      .createQueryBuilder('consultation')
      .leftJoinAndSelect('consultation.patient', 'patient')
      .leftJoinAndSelect('consultation.doctor', 'doctor');
    applyConsultationFilters(qb, query)
      .orderBy(`consultation.${query.sortBy ?? 'createdAt'}`, sortOrder)
      .addOrderBy('consultation.id', sortOrder)
      .skip(window.skip)
      .take(window.take);
    const [items, total] = await qb.getManyAndCount();
    return toPage(items, total, window);
  }

  // Patient history grows for years, so it is paged newest-first like every other list.
  async findByPatient(
    patientId: string,
    query: PaginationQueryDTO = {},
  ): Promise<IPagination<Consultation>> {
    await this.patientsService.findOne(patientId);
    const window = pageWindow(query);
    const [items, total] = await this.consultationsRepository.findAndCount({
      where: { patientId },
      relations: { doctor: true, visit: true, triage: true },
      order: { createdAt: 'DESC', id: 'DESC' },
      skip: window.skip,
      take: window.take,
    });
    return toPage(items, total, window);
  }

  async findByVisit(visitId: string): Promise<Consultation[]> {
    return this.consultationsRepository.find({
      where: { visitId },
      order: { createdAt: 'ASC' },
      relations: { doctor: true, patient: true, triage: true },
    });
  }
}
