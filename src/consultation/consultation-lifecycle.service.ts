import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdmissionsService } from 'src/admissions/admissions.service';
import { VisitIntenentsEnum } from 'src/queue/enums/visit-type.enum';
import { QueueEntry } from 'src/queue/entities/queue-entry.entity';
import { QueueEntriesService } from 'src/queue/queue-entries.service';
import { assertCanRouteClinically } from 'src/queue/journey/assert-can-route';
import { ConsultationActor } from './consultation-access.policy';
import { assertOpenForEditing } from './consultation-lock.policy';
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
    private readonly admissions: AdmissionsService,
  ) {}

  async complete(
    id: string,
    dto: CompleteConsultationDto,
    actor: ConsultationActor,
  ): Promise<CompletedConsultation> {
    if (dto.nextIntents?.length || dto.admission) {
      assertCanRouteClinically(actor.role);
    }
    if (
      !dto.admission &&
      dto.nextIntents?.includes(VisitIntenentsEnum.ADMISSION)
    ) {
      throw new BadRequestException(
        'Give a ward and reason to admit the patient',
      );
    }
    const consultation = await this.consultations.findEditable(id, actor);
    assertOpenForEditing(consultation);
    consultation.status = ConsultationStatus.COMPLETED;
    consultation.completedAt = new Date();
    consultation.completionNotes = dto.notes?.trim() || null;
    await this.consultationsRepository.manager.transaction(async (manager) => {
      await manager.save(consultation);
      if (!dto.admission) return;
      await this.admissions.admit(manager, dto.admission, {
        patientId: consultation.patientId,
        visitId: consultation.visitId ?? null,
        consultationId: consultation.id,
        admittedById: actor.id,
      });
    });
    const queueUpdate = await this.handOff(consultation, dto);
    return { consultation: await this.consultations.findOne(id), queueUpdate };
  }

  async cancel(
    id: string,
    actor: ConsultationActor,
    reason?: string,
  ): Promise<Consultation> {
    const consultation = await this.consultations.findEditable(id, actor);
    if (consultation.status === ConsultationStatus.CANCELLED) {
      return consultation;
    }
    if (consultation.status === ConsultationStatus.COMPLETED) {
      throw new ConflictException('A signed consultation cannot be cancelled');
    }
    consultation.status = ConsultationStatus.CANCELLED;
    consultation.completedAt = new Date();
    consultation.cancellationReason = reason?.trim() || null;
    await this.consultationsRepository.save(consultation);
    return this.consultations.findOne(id);
  }

  private async handOff(
    consultation: Consultation,
    dto: CompleteConsultationDto,
  ): Promise<QueueUpdate> {
    if (!consultation.visitId) return null;
    const intents = dto.nextIntents ?? [];
    await this.queueEntries.routeFromDoctor(
      consultation.visitId,
      dto.admission ? [...intents, VisitIntenentsEnum.ADMISSION] : intents,
      consultation.department,
    );
    return this.queueEntries.completeCurrentFor(
      consultation.visitId,
      consultation.department,
    );
  }
}
