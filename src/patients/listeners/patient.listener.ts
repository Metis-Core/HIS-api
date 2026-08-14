import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  PatientCreatedEvent,
  PatientDeletedEvent,
  PatientStatusChangedEvent,
} from '../events/patient.events';

@Injectable()
export class PatientListener {
  private readonly logger = new Logger(PatientListener.name);

  @OnEvent(PatientCreatedEvent.channel)
  onCreated(event: PatientCreatedEvent): void {
    this.logger.log(
      `Patient registered: ${event.data.mrn} (${event.data.fullName})`,
    );
  }

  @OnEvent(PatientStatusChangedEvent.channel)
  onStatusChanged(event: PatientStatusChangedEvent): void {
    this.logger.log(
      `Patient ${event.data.mrn} status ${event.previousStatus} -> ${event.data.status}`,
    );
  }

  @OnEvent(PatientDeletedEvent.channel)
  onDeleted(event: PatientDeletedEvent): void {
    this.logger.log(`Patient removed: ${event.data.mrn}`);
  }
}
