import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginationQueryDTO, pageWindow, toPage } from 'common/pagination';
import { IPagination } from 'common/response-format';
import { ConsultationActor } from './consultation-access.policy';
import { assertCanAddAddendum } from './consultation-lock.policy';
import { ConsultationService } from './consultation.service';
import { CreateAddendumDTO } from './dto/create-addendum.dto';
import { ConsultationAddendum } from './entities/consultation-addendum.entity';

@Injectable()
export class ConsultationAddendaService {
  constructor(
    @InjectRepository(ConsultationAddendum)
    private readonly addenda: Repository<ConsultationAddendum>,
    private readonly consultations: ConsultationService,
  ) {}

  async add(
    consultationId: string,
    dto: CreateAddendumDTO,
    actor: ConsultationActor,
  ): Promise<ConsultationAddendum> {
    const consultation = await this.consultations.findEditable(
      consultationId,
      actor,
    );
    assertCanAddAddendum(consultation);
    const saved = await this.addenda.save(
      this.addenda.create({
        consultationId,
        authorId: actor.id,
        body: dto.body.trim(),
      }),
    );
    return this.addenda.findOneOrFail({
      where: { id: saved.id },
      relations: { author: true },
    });
  }

  async list(
    consultationId: string,
    query: PaginationQueryDTO = {},
  ): Promise<IPagination<ConsultationAddendum>> {
    await this.consultations.findOne(consultationId);
    const window = pageWindow(query);
    const [items, total] = await this.addenda.findAndCount({
      where: { consultationId },
      relations: { author: true },
      order: { createdAt: 'DESC', id: 'DESC' },
      skip: window.skip,
      take: window.take,
    });
    return toPage(items, total, window);
  }
}
