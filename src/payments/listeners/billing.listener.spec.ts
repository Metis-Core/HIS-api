import { PatientAdmittedEvent } from 'src/admissions/events/patient-admitted.event';
import { PrescriptionCancelledEvent } from 'src/pharmacy/events/prescription-cancelled.event';
import { PrescriptionCreatedEvent } from 'src/pharmacy/events/prescription-created.event';
import { VisitIntenentsEnum } from 'src/queue/enums/visit-type.enum';
import { VisitCheckedInEvent } from 'src/queue/events/visit-checked-in.event';
import { QueueEntriesService } from 'src/queue/queue-entries.service';
import { ServiceCode } from 'src/services/service-codes';
import { PaymentsService } from '../payments.service';
import { BillingListener } from './billing.listener';

const payments = {
  addConsultationFee: jest.fn(),
  addLabCharges: jest.fn(),
  addServiceFee: jest.fn(),
  addPrescriptionCharges: jest.fn(),
  dropPendingChargesFor: jest.fn(),
};
const queueEntries = { ensureIntent: jest.fn() };
const listener = new BillingListener(
  payments as unknown as PaymentsService,
  queueEntries as unknown as QueueEntriesService,
);

describe('BillingListener', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    payments.addConsultationFee.mockResolvedValue({ id: 'charge' });
    payments.addServiceFee.mockResolvedValue({ id: 'charge', amount: 0 });
  });

  it('bills the consultation fee for a normal check-in', async () => {
    // Arrange
    const event = new VisitCheckedInEvent('v1', 'p1', 'r1', [
      VisitIntenentsEnum.EXAMINATION,
      VisitIntenentsEnum.CONSULTATION,
    ]);

    // Act
    await listener.onVisitCheckedIn(event);

    // Assert
    expect(payments.addConsultationFee).toHaveBeenCalledWith('v1', 'r1');
  });

  it('does not bill a consultation for a lab-only walk-in', async () => {
    // Arrange
    const event = new VisitCheckedInEvent('v1', 'p1', 'r1', [
      VisitIntenentsEnum.LAB,
    ]);

    // Act
    await listener.onVisitCheckedIn(event);

    // Assert
    expect(payments.addConsultationFee).not.toHaveBeenCalled();
    expect(payments.addServiceFee).not.toHaveBeenCalled();
  });

  it('records a free immunization without sending the patient to billing', async () => {
    // Arrange
    const event = new VisitCheckedInEvent('v1', 'p1', 'n1', [
      VisitIntenentsEnum.IMMUNIZATION,
    ]);

    // Act
    await listener.onVisitCheckedIn(event);

    // Assert
    expect(payments.addServiceFee).toHaveBeenCalledWith(
      'v1',
      ServiceCode.IMMUNIZATION,
      'n1',
    );
    expect(payments.addConsultationFee).not.toHaveBeenCalled();
    expect(queueEntries.ensureIntent).not.toHaveBeenCalled();
  });

  it('queues billing when the antenatal visit carries a fee', async () => {
    // Arrange
    payments.addServiceFee.mockResolvedValue({ id: 'charge', amount: 10000 });
    const event = new VisitCheckedInEvent('v1', 'p1', 'n1', [
      VisitIntenentsEnum.ANTENATAL,
    ]);

    // Act
    await listener.onVisitCheckedIn(event);

    // Assert
    expect(payments.addServiceFee).toHaveBeenCalledWith(
      'v1',
      ServiceCode.ANTENATAL_VISIT,
      'n1',
    );
    expect(queueEntries.ensureIntent).toHaveBeenCalledWith(
      'v1',
      VisitIntenentsEnum.BILLING,
    );
  });

  it('bills the admission fee when a patient is admitted', async () => {
    // Act
    await listener.onPatientAdmitted(
      new PatientAdmittedEvent('a1', 'v1', 'p1', 'd1'),
    );

    // Assert
    expect(payments.addServiceFee).toHaveBeenCalledWith(
      'v1',
      ServiceCode.ADMISSION_FEE,
      'd1',
    );
  });

  it('bills prescribed medicines against the visit and unbills a cancelled prescription', async () => {
    // Arrange
    const lines = [
      { name: 'Amoxicillin 500 mg Capsule', quantity: 21, unitPrice: 300 },
    ];

    // Act
    await listener.onPrescriptionCreated(
      new PrescriptionCreatedEvent('rx1', 'p1', 'd1', 1, 'v1', lines),
    );
    await listener.onPrescriptionCancelled(
      new PrescriptionCancelledEvent('rx1'),
    );

    // Assert
    expect(payments.addPrescriptionCharges).toHaveBeenCalledWith(
      'v1',
      'rx1',
      lines,
      'd1',
    );
    expect(payments.dropPendingChargesFor).toHaveBeenCalledWith('rx1');
  });

  it('skips prescriptions that are not tied to a visit', async () => {
    // Act
    await listener.onPrescriptionCreated(
      new PrescriptionCreatedEvent('rx1', 'p1', 'd1', 1, null, []),
    );

    // Assert
    expect(payments.addPrescriptionCharges).not.toHaveBeenCalled();
  });
});
