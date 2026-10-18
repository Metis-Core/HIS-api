import { TriageAcuity } from 'src/traige/enums/triage-acuity.enum';
import { TriageCategory } from '../enums/triage-category.enum';
import { VisitTypeEnum } from '../enums/visit-type.enum';
import {
  categoryForAcuity,
  isMoreUrgent,
  nextEmergencyNumber,
  priorityFor,
  resolveCheckInCategory,
} from './visit-priority';

describe('visit priority', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ranks red above yellow above green and uncategorised', () => {
    // Arrange / Act
    const [red, yellow, green, none] = [
      priorityFor(TriageCategory.RED),
      priorityFor(TriageCategory.YELLOW),
      priorityFor(TriageCategory.GREEN),
      priorityFor(null),
    ];

    // Assert
    expect(red).toBeGreaterThan(yellow);
    expect(yellow).toBeGreaterThan(green);
    expect(green).toBe(none);
  });

  it.each([
    [TriageAcuity.LEVEL_1, TriageCategory.RED],
    [TriageAcuity.LEVEL_2, TriageCategory.RED],
    [TriageAcuity.LEVEL_3, TriageCategory.YELLOW],
    [TriageAcuity.LEVEL_5, TriageCategory.GREEN],
  ])('maps acuity %s to %s', (acuity, expected) => {
    // Arrange / Act
    const category = categoryForAcuity(acuity);

    // Assert
    expect(category).toBe(expected);
  });

  it('treats an uncategorised emergency as red, a walk-in as none', () => {
    // Arrange / Act
    const emergency = resolveCheckInCategory(
      VisitTypeEnum.EMERGENCY,
      undefined,
    );
    const walkIn = resolveCheckInCategory(VisitTypeEnum.WALK_IN, undefined);

    // Assert
    expect(emergency).toBe(TriageCategory.RED);
    expect(walkIn).toBeNull();
  });

  it('only counts a change to a more urgent colour as an upgrade', () => {
    // Arrange / Act / Assert
    expect(isMoreUrgent(TriageCategory.RED, TriageCategory.YELLOW)).toBe(true);
    expect(isMoreUrgent(TriageCategory.GREEN, TriageCategory.RED)).toBe(false);
    expect(isMoreUrgent(TriageCategory.GREEN, null)).toBe(true);
  });

  it('numbers emergencies per day', () => {
    // Arrange
    const day = new Date(2026, 9, 18, 10, 0);

    // Act
    const first = nextEmergencyNumber(day, null);
    const next = nextEmergencyNumber(day, 'EM-20261018-007');
    const afterYesterday = nextEmergencyNumber(day, 'EM-20261017-042');

    // Assert
    expect(first).toBe('EM-20261018-001');
    expect(next).toBe('EM-20261018-008');
    expect(afterYesterday).toBe('EM-20261018-001');
  });
});
