import { Department } from 'common/enums/department.enum';
import { QueueEntryStatus } from '../enums/queue-entry-status.enum';
import { buildVisitTimeline, TimelineSource } from './visit-timeline';

const at = (minute: number) => new Date(Date.UTC(2026, 9, 18, 8, minute));

const entry = (overrides: Partial<TimelineSource>): TimelineSource => ({
  id: 'e',
  department: Department.TRIAGE,
  status: QueueEntryStatus.WAITING,
  sequenceNumber: 1,
  createdAt: at(0),
  startedAt: null,
  completedAt: null,
  servedById: null,
  ...overrides,
});

describe('buildVisitTimeline', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('measures each wait from when the previous stage finished', () => {
    // Arrange
    const entries = [
      entry({
        id: 'r',
        department: Department.RECEPTION,
        status: QueueEntryStatus.COMPLETED,
        startedAt: at(0),
        completedAt: at(0),
      }),
      entry({
        id: 't',
        sequenceNumber: 2,
        status: QueueEntryStatus.COMPLETED,
        startedAt: at(10),
        completedAt: at(15),
      }),
      entry({
        id: 'c',
        department: Department.OUTPATIENT_CLINIC,
        sequenceNumber: 3,
        status: QueueEntryStatus.IN_SERVICE,
        startedAt: at(40),
      }),
    ];

    // Act
    const timeline = buildVisitTimeline(entries, at(50));

    // Assert
    expect(timeline.stages.map((s) => s.waitSeconds)).toEqual([0, 600, 1500]);
    expect(timeline.stages.map((s) => s.serviceSeconds)).toEqual([0, 300, 600]);
    expect(timeline.totalSeconds).toBe(3000);
  });

  it('keeps counting the wait of the stage the patient is waiting for', () => {
    // Arrange
    const entries = [
      entry({
        id: 't',
        status: QueueEntryStatus.COMPLETED,
        startedAt: at(0),
        completedAt: at(5),
      }),
      entry({ id: 'c', sequenceNumber: 2, createdAt: at(0) }),
    ];

    // Act
    const [, waiting] = buildVisitTimeline(entries, at(25)).stages;

    // Assert
    expect(waiting.readyAt).toEqual(at(5));
    expect(waiting.waitSeconds).toBe(1200);
  });

  it('has no wait yet for stages behind an unfinished one, and flags reviews', () => {
    // Arrange
    const entries = [
      entry({
        id: 'lab',
        status: QueueEntryStatus.IN_SERVICE,
        startedAt: at(1),
      }),
      entry({
        id: 'review',
        sequenceNumber: 2,
        department: Department.OUTPATIENT_CLINIC,
        metadata: { review: true },
      }),
    ];

    // Act
    const [, review] = buildVisitTimeline(entries, at(30)).stages;

    // Assert
    expect(review.readyAt).toBeNull();
    expect(review.waitSeconds).toBeNull();
    expect(review.review).toBe(true);
  });
});
