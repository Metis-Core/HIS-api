import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PatientAdmittedEvent } from 'src/admissions/events/patient-admitted.event';
import { LabOrderCreatedEvent } from 'src/lab/events/lab-order-created.event';
import { OrderKind } from 'src/orders/enums/order-kind.enum';
import {
  ProcedureCancelledEvent,
  ProcedureOrderedEvent,
} from 'src/orders/events/procedure-order.events';
import { PrescriptionCancelledEvent } from 'src/pharmacy/events/prescription-cancelled.event';
import { PrescriptionCreatedEvent } from 'src/pharmacy/events/prescription-created.event';
import { ServiceCode, ServiceCodeValue } from 'src/services/service-codes';
import { QueueEntriesService } from 'src/queue/queue-entries.service';
import { VisitCheckedInEvent } from 'src/queue/events/visit-checked-in.event';
import { VisitIntenentsEnum } from 'src/queue/enums/visit-type.enum';
import { ChargeSource } from '../enums/charge.enum';
import { PaymentsService } from '../payments.service';

@Injectable()
export class BillingListener {
  private readonly logger = new Logger(BillingListener.name);

  constructor(
    private readonly payments: PaymentsService,
    private readonly queueEntries: QueueEntriesService,
  ) {}

  @OnEvent(VisitCheckedInEvent.channel, { async: true })
  async onVisitCheckedIn(event: VisitCheckedInEvent) {
    await this.billServiceVisit(event);
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

  // Antenatal and immunization visits bill their service line (often free); a paid one also queues billing.
  private async billServiceVisit(event: VisitCheckedInEvent) {
    const code: ServiceCodeValue | null = event.intents.includes(
      VisitIntenentsEnum.ANTENATAL,
    )
      ? ServiceCode.ANTENATAL_VISIT
      : event.intents.includes(VisitIntenentsEnum.IMMUNIZATION)
        ? ServiceCode.IMMUNIZATION
        : null;
    if (!code) return;
    try {
      const charge = await this.payments.addServiceFee(
        event.visitId,
        code,
        event.checkedInById,
      );
      if (charge && charge.amount > 0) {
        await this.queueEntries.ensureIntent(
          event.visitId,
          VisitIntenentsEnum.BILLING,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to bill ${code} for visit ${event.visitId}`,
        error as Error,
      );
    }
  }

  @OnEvent(PatientAdmittedEvent.channel, { async: true })
  async onPatientAdmitted(event: PatientAdmittedEvent) {
    if (!event.visitId) return;
    try {
      await this.payments.addServiceFee(
        event.visitId,
        ServiceCode.ADMISSION_FEE,
        event.admittedById,
      );
    } catch (error) {
      this.logger.error(
        `Failed to bill admission ${event.admissionId}`,
        error as Error,
      );
    }
  }

  @OnEvent(PrescriptionCreatedEvent.name, { async: true })
  async onPrescriptionCreated(event: PrescriptionCreatedEvent) {
    if (!event.visitId) return;
    try {
      await this.payments.addPrescriptionCharges(
        event.visitId,
        event.prescriptionId,
        event.lines,
        event.prescribedById,
      );
    } catch (error) {
      this.logger.error(
        `Failed to bill prescription ${event.prescriptionId}`,
        error as Error,
      );
    }
  }

  @OnEvent(PrescriptionCancelledEvent.channel, { async: true })
  async onPrescriptionCancelled(event: PrescriptionCancelledEvent) {
    try {
      await this.payments.dropPendingChargesFor(event.prescriptionId);
    } catch (error) {
      this.logger.error(
        `Failed to unbill prescription ${event.prescriptionId}`,
        error as Error,
      );
    }
  }

  @OnEvent(ProcedureOrderedEvent.channel, { async: true })
  async onProcedureOrdered(event: ProcedureOrderedEvent) {
    if (!event.visitId || event.price <= 0) return;
    try {
      await this.payments.addProcedureCharge(
        event.visitId,
        event.kind === OrderKind.RADIOLOGY
          ? ChargeSource.RADIOLOGY
          : ChargeSource.SURGERY,
        { id: event.orderId, name: event.name, price: event.price },
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
