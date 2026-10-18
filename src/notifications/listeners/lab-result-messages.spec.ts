import { LabResultVerifiedEvent } from 'src/lab/events/lab-result-verified.event';
import { NotificationPriority } from '../enums/notification-priority.enum';
import { resultPriority, verifiedMessage } from './lab-result-messages';

const event = (flagged: boolean, critical: boolean, amended = false) =>
  new LabResultVerifiedEvent(
    'o1',
    'i1',
    'p1',
    'doc',
    'CBC',
    flagged,
    critical,
    amended,
  );

describe('lab result messages', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ranks critical above out-of-range above normal', () => {
    // Arrange / Act
    const levels = [
      resultPriority(true, true),
      resultPriority(false, true),
      resultPriority(false, false),
    ];

    // Assert
    expect(levels).toEqual([
      NotificationPriority.CRITICAL,
      NotificationPriority.HIGH,
      NotificationPriority.NORMAL,
    ]);
  });

  it('words critical, amended and out-of-range results distinctly', () => {
    // Arrange / Act
    const critical = verifiedMessage(event(true, true), 'Amina N');
    const amended = verifiedMessage(event(false, false, true), 'Amina N');
    const flagged = verifiedMessage(event(true, false), 'Amina N');

    // Assert
    expect(critical.title).toBe('Critical result: CBC');
    expect(amended.title).toBe('Amended result: CBC');
    expect(flagged.body).toContain('outside the reference range');
  });
});
