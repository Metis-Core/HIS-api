import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { LabOrderCreatedEvent } from 'src/lab/events/lab-order-created.event';
import { VisitCheckedInEvent } from 'src/queue/events/visit-checked-in.event';
import { PaymentsService } from '../payments.service';

@Injectable()
export class BillingListener {
  private readonly logger = new Logger(BillingListener.name);

  constructor(private readonly payments: PaymentsService) {}

  @OnEvent(VisitCheckedInEvent.channel, { async: true })
  async onVisitCheckedIn(event: VisitCheckedInEvent) {
    try {
      const charge = await this.payments.addConsultationFee(event.visitId, event.checkedInById);
      if (!charge) {
        this.logger.warn(`No active "Consultation" service priced; visit ${event.visitId} has no consultation fee`);
      }
    } catch (error) {
      this.logger.error(`Failed to bill consultation for visit ${event.visitId}`, error as Error);
    }
  }

  @OnEvent(LabOrderCreatedEvent.name, { async: true })
  async onLabOrderCreated(event: LabOrderCreatedEvent) {
    if (!event.visitId) return;
    try {
      await this.payments.addLabCharges(event.visitId, event.items, event.orderedById);
    } catch (error) {
      this.logger.error(`Failed to bill lab order ${event.orderId}`, error as Error);
    }
  }
}
