import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from 'common/enums/department.enum';
import { UserRole } from 'common/enums/userRoles.enum';
import { LabOrderCancelledEvent } from 'src/lab/events/lab-order-cancelled.event';
import { LabOrderCompletedEvent } from 'src/lab/events/lab-order-completed.event';
import { LabOrderCreatedEvent } from 'src/lab/events/lab-order-created.event';
import { LabResultReadyEvent } from 'src/lab/events/lab-result-ready.event';
import { Patient } from 'src/patients/entities/patient.entity';
import { Prescription } from 'src/pharmacy/entities/prescription.entity';
import { PrescriptionStatus } from 'src/pharmacy/enums/prescription-status.enum';
import { PrescriptionCreatedEvent } from 'src/pharmacy/events/prescription-created.event';
import { PrescriptionDispensedEvent } from 'src/pharmacy/events/prescription-dispensed.event';
import { QueueEntry } from 'src/queue/entities/queue-entry.entity';
import { Visit } from 'src/queue/entities/visit.entity';
import {
  QueueEntryCalledEvent,
  QueueEntryCreatedEvent,
} from 'src/queue/events/queue.events';
import { VisitCheckedInEvent } from 'src/queue/events/visit-checked-in.event';
import { NotificationDispatcher } from '../notification-dispatcher.service';
import { NotificationPriority } from '../enums/notification-priority.enum';
import { NotificationType } from '../enums/notification-type.enum';

const DEPARTMENT_LABEL: Record<Department, string> = {
  [Department.RECEPTION]: 'reception',
  [Department.TRIAGE]: 'triage',
  [Department.OUTPATIENT_CLINIC]: 'the outpatient clinic',
  [Department.INPATIENT_WARD]: 'the inpatient ward',
  [Department.MAIN_LABORATORY]: 'the laboratory',
  [Department.RADIOLOGY]: 'radiology',
  [Department.DENTAL]: 'dental',
  [Department.ANTENATAL]: 'antenatal',
  [Department.MAIN_PHARMACY]: 'the pharmacy',
  [Department.FINANCE]: 'finance',
  [Department.ADMINISTRATION]: 'administration',
};

// Which roles work a department's queue.
const DEPARTMENT_ROLES: Record<Department, readonly UserRole[]> = {
  [Department.RECEPTION]: [UserRole.RECEPTIONIST],
  [Department.TRIAGE]: [UserRole.NURSE],
  [Department.OUTPATIENT_CLINIC]: [UserRole.DOCTOR],
  [Department.INPATIENT_WARD]: [UserRole.DOCTOR, UserRole.NURSE],
  [Department.MAIN_LABORATORY]: [UserRole.LAB_TECH],
  [Department.RADIOLOGY]: [UserRole.LAB_TECH],
  [Department.DENTAL]: [UserRole.DOCTOR, UserRole.NURSE],
  [Department.ANTENATAL]: [UserRole.DOCTOR, UserRole.NURSE],
  [Department.MAIN_PHARMACY]: [UserRole.PHARMACIST],
  [Department.FINANCE]: [UserRole.ACCOUNTANT],
  [Department.ADMINISTRATION]: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
};

// Where a staff member lands when they open the notification (matches the sidebar each role has).
const DEPARTMENT_ACTION_URL: Record<Department, string> = {
  [Department.RECEPTION]: '/patients',
  [Department.TRIAGE]: '/patients',
  [Department.OUTPATIENT_CLINIC]: '/queue',
  [Department.INPATIENT_WARD]: '/queue',
  [Department.MAIN_LABORATORY]: '/lab',
  [Department.RADIOLOGY]: '/lab',
  [Department.DENTAL]: '/queue',
  [Department.ANTENATAL]: '/queue',
  [Department.MAIN_PHARMACY]: '/pharmacy',
  [Department.FINANCE]: '/patients',
  [Department.ADMINISTRATION]: '/queue',
};

/** Turns domain events into role- and user-targeted notifications. */
@Injectable()
export class WorkflowNotificationsListener {
  private readonly logger = new Logger(WorkflowNotificationsListener.name);

  constructor(
    private readonly dispatcher: NotificationDispatcher,
    @InjectRepository(Patient)
    private readonly patientsRepository: Repository<Patient>,
    @InjectRepository(Visit)
    private readonly visitsRepository: Repository<Visit>,
    @InjectRepository(QueueEntry)
    private readonly queueEntriesRepository: Repository<QueueEntry>,
    @InjectRepository(Prescription)
    private readonly prescriptionsRepository: Repository<Prescription>,
  ) {}

  @OnEvent(VisitCheckedInEvent.channel, { async: true })
  async onVisitCheckedIn(event: VisitCheckedInEvent) {
    await this.safely('visit check-in', async () => {
      const first = await this.queueEntriesRepository.findOne({
        where: { visitId: event.visitId },
        order: { sequenceNumber: 'ASC' },
      });
      if (!first) return;
      const patient = await this.patientLabel(event.patientId);
      await this.notifyDepartment(
        first.department,
        {
          type: NotificationType.QUEUE,
          priority: NotificationPriority.NORMAL,
          title: 'New patient in queue',
          body: `${patient} checked in and is waiting for ${DEPARTMENT_LABEL[first.department]}.`,
          resourceType: 'visit',
          resourceId: event.visitId,
        },
        event.checkedInById,
      );
    });
  }

  @OnEvent(QueueEntryCreatedEvent.channel, { async: true })
  async onQueueEntryCreated(event: QueueEntryCreatedEvent) {
    await this.safely('queue entry created', async () => {
      const { department, visitId } = event.data;
      const patient = await this.patientLabelForVisit(visitId);
      await this.notifyDepartment(department, {
        type: NotificationType.QUEUE,
        priority: NotificationPriority.NORMAL,
        title: `New patient for ${DEPARTMENT_LABEL[department]}`,
        body: `${patient} has been added to the ${DEPARTMENT_LABEL[department]} queue.`,
        resourceType: 'visit',
        resourceId: visitId,
      });
    });
  }

  // Auto-advance (no staff member attached) means the patient just arrived from the previous stage.
  @OnEvent(QueueEntryCalledEvent.channel, { async: true })
  async onQueueEntryCalled(event: QueueEntryCalledEvent) {
    if (event.data.servedById) return;
    await this.safely('queue entry advanced', async () => {
      const { department, visitId, patientId } = event.data;
      const patient = patientId ? await this.patientLabel(patientId) : await this.patientLabelForVisit(visitId);
      await this.notifyDepartment(department, {
        type: NotificationType.QUEUE,
        priority: NotificationPriority.HIGH,
        title: `Patient ready for ${DEPARTMENT_LABEL[department]}`,
        body: `${patient} has finished the previous stage and is ready for ${DEPARTMENT_LABEL[department]}.`,
        resourceType: 'visit',
        resourceId: visitId,
      });
    });
  }

  @OnEvent(LabOrderCreatedEvent.name, { async: true })
  async onLabOrderCreated(event: LabOrderCreatedEvent) {
    await this.safely('lab order created', async () => {
      const patient = await this.patientLabel(event.patientId);
      const count = event.items.length;
      await this.dispatcher.toRoles(
        DEPARTMENT_ROLES[Department.MAIN_LABORATORY],
        {
          type: NotificationType.LAB_ORDER,
          priority: NotificationPriority.NORMAL,
          title: 'New lab order',
          body: `${count} test${count === 1 ? '' : 's'} ordered for ${patient}.`,
          actionUrl: '/lab',
          resourceType: 'lab_order',
          resourceId: event.orderId,
        },
        event.orderedById,
      );
    });
  }

  @OnEvent(LabOrderCancelledEvent.name, { async: true })
  async onLabOrderCancelled(event: LabOrderCancelledEvent) {
    await this.safely('lab order cancelled', async () => {
      const patient = await this.patientLabel(event.patientId);
      await this.dispatcher.toRoles(DEPARTMENT_ROLES[Department.MAIN_LABORATORY], {
        type: NotificationType.LAB_ORDER,
        priority: NotificationPriority.NORMAL,
        title: 'Lab order cancelled',
        body: `The lab order for ${patient} was cancelled.`,
        actionUrl: '/lab',
        resourceType: 'lab_order',
        resourceId: event.orderId,
      });
    });
  }

  @OnEvent(LabResultReadyEvent.name, { async: true })
  async onLabResultReady(event: LabResultReadyEvent) {
    await this.safely('lab result ready', async () => {
      const patient = await this.patientLabel(event.patientId);
      await this.dispatcher.toUsers([event.orderedById], {
        type: NotificationType.LAB_RESULT,
        priority: event.isAbnormal ? NotificationPriority.CRITICAL : NotificationPriority.HIGH,
        title: event.isAbnormal ? `Abnormal result: ${event.testName}` : `Result ready: ${event.testName}`,
        body: `${patient}: ${event.testName} result is in${event.isAbnormal ? ' and flagged abnormal' : ''}. Other tests on this order are still pending.`,
        actionUrl: `/patients/${event.patientId}`,
        resourceType: 'lab_order',
        resourceId: event.orderId,
      });
    });
  }

  @OnEvent(LabOrderCompletedEvent.name, { async: true })
  async onLabOrderCompleted(event: LabOrderCompletedEvent) {
    await this.safely('lab order completed', async () => {
      const patient = await this.patientLabel(event.patientId);
      const abnormal = event.abnormalCount > 0;
      await this.dispatcher.toUsers([event.orderedById], {
        type: NotificationType.LAB_RESULT,
        priority: abnormal ? NotificationPriority.CRITICAL : NotificationPriority.HIGH,
        title: abnormal ? 'Lab results ready — abnormal findings' : 'Lab results ready',
        body: `All results for ${patient} are ready${abnormal ? `; ${event.abnormalCount} flagged abnormal` : ''}.`,
        actionUrl: `/patients/${event.patientId}`,
        resourceType: 'lab_order',
        resourceId: event.orderId,
      });
    });
  }

  @OnEvent(PrescriptionCreatedEvent.name, { async: true })
  async onPrescriptionCreated(event: PrescriptionCreatedEvent) {
    await this.safely('prescription created', async () => {
      const patient = await this.patientLabel(event.patientId);
      await this.dispatcher.toRoles(
        DEPARTMENT_ROLES[Department.MAIN_PHARMACY],
        {
          type: NotificationType.PRESCRIPTION,
          priority: NotificationPriority.NORMAL,
          title: 'New prescription',
          body: `${event.itemCount} medication${event.itemCount === 1 ? '' : 's'} to dispense for ${patient}.`,
          actionUrl: '/pharmacy',
          resourceType: 'prescription',
          resourceId: event.prescriptionId,
        },
        event.prescribedById,
      );
    });
  }

  @OnEvent(PrescriptionDispensedEvent.name, { async: true })
  async onPrescriptionDispensed(event: PrescriptionDispensedEvent) {
    await this.safely('prescription dispensed', async () => {
      const prescription = await this.prescriptionsRepository.findOne({
        where: { id: event.prescriptionId },
      });
      if (!prescription) return;
      const patient = await this.patientLabel(event.patientId);
      const complete = prescription.status === PrescriptionStatus.DISPENSED;
      await this.dispatcher.toUsers([prescription.prescribedById], {
        type: NotificationType.PRESCRIPTION,
        priority: NotificationPriority.NORMAL,
        title: complete ? 'Medication dispensed' : 'Medication partially dispensed',
        body: complete
          ? `The prescription for ${patient} has been fully dispensed.`
          : `Part of the prescription for ${patient} has been dispensed; the rest is pending.`,
        actionUrl: `/patients/${event.patientId}`,
        resourceType: 'prescription',
        resourceId: event.prescriptionId,
      });
    });
  }

  private async notifyDepartment(
    department: Department,
    payload: Parameters<NotificationDispatcher['toRoles']>[1],
    excludeUserId?: string,
  ): Promise<void> {
    await this.dispatcher.toRoles(
      DEPARTMENT_ROLES[department],
      { actionUrl: DEPARTMENT_ACTION_URL[department], ...payload },
      excludeUserId,
    );
  }

  private async patientLabel(patientId: string): Promise<string> {
    const patient = await this.patientsRepository.findOne({
      where: { id: patientId },
      select: { id: true, firstName: true, lastName: true },
    });
    return patient ? `${patient.firstName} ${patient.lastName}`.trim() : 'A patient';
  }

  private async patientLabelForVisit(visitId: string): Promise<string> {
    const visit = await this.visitsRepository.findOne({
      where: { id: visitId },
      select: { id: true, patientId: true },
    });
    return visit ? this.patientLabel(visit.patientId) : 'A patient';
  }

  private async safely(what: string, work: () => Promise<void>): Promise<void> {
    try {
      await work();
    } catch (error) {
      this.logger.error(`Failed to send ${what} notifications`, error as Error);
    }
  }
}
