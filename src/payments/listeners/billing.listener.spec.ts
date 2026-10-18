import { VisitIntenentsEnum } from 'src/queue/enums/visit-type.enum';
import { VisitCheckedInEvent } from 'src/queue/events/visit-checked-in.event';
import { PaymentsService } from '../payments.service';
import { BillingListener } from './billing.listener';

const payments = { addConsultationFee: jest.fn(), addLabCharges: jest.fn() };
const listener = new BillingListener(payments as unknown as PaymentsService);

describe('BillingListener', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    payments.addConsultationFee.mockResolvedValue({ id: 'charge' });
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
  });
});
