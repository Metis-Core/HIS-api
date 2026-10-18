import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QueueEntry } from 'src/queue/entities/queue-entry.entity';
import { QueueEntriesService } from 'src/queue/queue-entries.service';
import { assertCanRouteClinically } from 'src/queue/journey/assert-can-route';
import { ConsultationActor } from './consultation-access.policy';
import { ConsultationService } from './consultation.service';
import { CompleteConsultationDto } from './dto/complete-consultation.dto';
import { Consultation } from './entities/consultation.entity';
import { ConsultationStatus } from './enums/consultation-status.enum';

type QueueUpdate = { entry: QueueEntry; next: QueueEntry | null } | null;

export interface CompletedConsultation {
  consultation: Consultation;
  queueUpdate: QueueUpdate;
}

/** Signing (complete) and cancelling an encounter, including the queue hand-off. */
@Injectable()
export class ConsultationLifecycleService {
  constructor(
    @InjectRepository(Consultation)
    private readonly consultationsRepository: Repository<Consultation>,
    private readonly consultations: ConsultationService,
    private readonly queueEntries: QueueEntriesService,
  ) {}

  async complete(
    id: string,
    dto: CompleteConsultationDto,
    actor: ConsultationActor,
  ): Promise<CompletedConsultation> {
    if (dto.nextIntents?.length) assertCanRouteClinically(actor.role);
    const consultation = await this.consultations.findEditable(id, actor);
    if (consultation.status === ConsultationStatus.CANCELLED) {
      throw new BadRequestException(
        'Cancelled consultation cannot be completed',
      );
    }
    if (consultation.status !== ConsultationStatus.COMPLETED) {
      consultation.status = ConsultationStatus.COMPLETED;
      consultation.completedAt = new Date();
      if (dto.notes) consultation.notes = dto.notes;
      await this.consultationsRepository.save(consultation);
    }
    return {
      consultation: await this.consultations.findOne(id),
      queueUpdate: await this.handOff(consultation, dto),
    };
  }

  async cancel(
    id: string,
    actor: ConsultationActor,
    reason?: string,
  ): Promise<Consultation> {
    const consultation = await this.consultations.findEditable(id, actor);
    if (consultation.status === ConsultationStatus.CANCELLED)
      return consultation;
    consultation.status = ConsultationStatus.CANCELLED;
    consultation.completedAt = consultation.completedAt ?? new Date();
    if (reason) consultation.notes = reason;
    await this.consultationsRepository.save(consultation);
    return this.consultations.findOne(id);
  }

  private async handOff(
    consultation: Consultation,
    dto: CompleteConsultationDto,
  ): Promise<QueueUpdate> {
    if (!consultation.visitId) return null;
    await this.queueEntries.routeFromDoctor(
      consultation.visitId,
      dto.nextIntents ?? [],
      consultation.department,
    );
    return this.queueEntries.completeCurrentFor(
      consultation.visitId,
      consultation.department,
    );
  }
}
