import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { LabOrderCreatedEvent } from 'src/lab/events/lab-order-created.event';
import { OrderKind } from 'src/orders/enums/order-kind.enum';
import {
  ProcedureCancelledEvent,
  ProcedureOrderedEvent,
} from 'src/orders/events/procedure-order.events';
import { VisitCheckedInEvent } from 'src/queue/events/visit-checked-in.event';
import { VisitIntenentsEnum } from 'src/queue/enums/visit-type.enum';
import { ChargeSource } from '../enums/charge.enum';
import { PaymentsService } from '../payments.service';

@Injectable()
export class BillingListener {
  private readonly logger = new Logger(BillingListener.name);

  constructor(private readonly payments: PaymentsService) {}

  @OnEvent(VisitCheckedInEvent.channel, { async: true })
  async onVisitCheckedIn(event: VisitCheckedInEvent) {
    if (!event.intents.includes(VisitIntenentsEnum.CONSULTATION)) return;
    try {
      const charge = await this.payments.addConsultationFee(
        event.visitId,
        event.checkedInById,
      );
      if (!charge) {
        this.logger.warn(
          `No active "Consultation" service priced; visit ${event.visitId} has no consultation fee`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to bill consultation for visit ${event.visitId}`,
        error as Error,
      );
    }
  }

  @OnEvent(ProcedureOrderedEvent.channel, { async: true })
  async onProcedureOrdered(event: ProcedureOrderedEvent) {
    if (!event.visitId || !event.serviceId) return;
    try {
      await this.payments.addProcedureCharge(
        event.visitId,
        event.kind === OrderKind.RADIOLOGY
          ? ChargeSource.RADIOLOGY
          : ChargeSource.SURGERY,
        { id: event.orderId, name: event.name, serviceId: event.serviceId },
        event.orderedById,
      );
    } catch (error) {
      this.logger.error(
        `Failed to bill order ${event.orderId}`,
        error as Error,
      );
    }
  }

  @OnEvent(ProcedureCancelledEvent.channel, { async: true })
  async onProcedureCancelled(event: ProcedureCancelledEvent) {
    try {
      await this.payments.dropPendingChargesFor(event.orderId);
    } catch (error) {
      this.logger.error(
        `Failed to unbill order ${event.orderId}`,
        error as Error,
      );
    }
  }

  @OnEvent(LabOrderCreatedEvent.name, { async: true })
  async onLabOrderCreated(event: LabOrderCreatedEvent) {
    if (!event.visitId) return;
    try {
      await this.payments.addLabCharges(
        event.visitId,
        event.items,
        event.orderedById,
      );
    } catch (error) {
      this.logger.error(
        `Failed to bill lab order ${event.orderId}`,
        error as Error,
      );
    }
  }
}
