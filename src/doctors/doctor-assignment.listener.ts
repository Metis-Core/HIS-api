import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Department } from 'common/enums/department.enum';
import { AvailabilityChangedEvent } from 'src/availability/events/availability-changed.event';
import { VisitIntenentsEnum } from 'src/queue/enums/visit-type.enum';
import { QueueEntryCreatedEvent } from 'src/queue/events/queue.events';
import { VisitCheckedInEvent } from 'src/queue/events/visit-checked-in.event';
import { UserAccountChangedEvent } from 'src/users/events/user-account-changed.event';
import { DoctorAssignmentService } from './doctor-assignment.service';

@Injectable()
export class DoctorAssignmentListener {
  private readonly logger = new Logger(DoctorAssignmentListener.name);

  constructor(private readonly assignment: DoctorAssignmentService) {}

  @OnEvent(AvailabilityChangedEvent.channel, { async: true })
  onAvailabilityChanged(): Promise<void> {
    return this.safely('availability change', () =>
      this.assignment.reconcile(),
    );
  }

  @OnEvent(UserAccountChangedEvent.channel, { async: true })
  onAccountChanged(): Promise<void> {
    return this.safely('account change', () => this.assignment.reconcile());
  }

  @OnEvent(QueueEntryCreatedEvent.channel, { async: true })
  onQueueEntryCreated(event: QueueEntryCreatedEvent): Promise<void> {
    if (event.data.department !== Department.OUTPATIENT_CLINIC) {
      return Promise.resolve();
    }
    return this.safely('consultation stage', () =>
      this.assignment.assignIfNeeded(event.data.visitId),
    );
  }

  @OnEvent(VisitCheckedInEvent.channel, { async: true })
  onVisitCheckedIn(event: VisitCheckedInEvent): Promise<void> {
    return this.safely('check-in', async () => {
      const consultation = event.intents.includes(
        VisitIntenentsEnum.CONSULTATION,
      );
      if (consultation && event.preferredDoctorId) {
        await this.assignment.assignRequested(
          event.visitId,
          event.preferredDoctorId,
          event.checkedInById,
        );
        return;
      }
      await this.assignment.assignEmergency(event.visitId);
      // Without triage the consultation is the first stage, so the doctor is chosen now.
      if (
        consultation &&
        !event.intents.includes(VisitIntenentsEnum.EXAMINATION)
      ) {
        await this.assignment.assignIfNeeded(event.visitId);
      }
    });
  }

  private async safely(
    what: string,
    work: () => Promise<unknown>,
  ): Promise<void> {
    try {
      await work();
    } catch (error) {
      this.logger.error(
        `Doctor assignment failed after ${what}`,
        error as Error,
      );
    }
  }
}
