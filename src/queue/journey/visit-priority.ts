import { TriageAcuity } from 'src/traige/enums/triage-acuity.enum';
import { TriageCategory } from '../enums/triage-category.enum';
import { VisitTypeEnum } from '../enums/visit-type.enum';

export const DEFAULT_PRIORITY = 5;

// Queues sort by priority DESC, so red patients jump every department's queue.
const CATEGORY_PRIORITY: Record<TriageCategory, number> = {
  [TriageCategory.RED]: 30,
  [TriageCategory.YELLOW]: 20,
  [TriageCategory.GREEN]: DEFAULT_PRIORITY,
};

const CATEGORY_RANK: Record<TriageCategory, number> = {
  [TriageCategory.RED]: 3,
  [TriageCategory.YELLOW]: 2,
  [TriageCategory.GREEN]: 1,
};

export function priorityFor(category: TriageCategory | null): number {
  return category ? CATEGORY_PRIORITY[category] : DEFAULT_PRIORITY;
}

export function categoryForAcuity(acuity: TriageAcuity): TriageCategory {
  switch (acuity) {
    case TriageAcuity.LEVEL_1:
    case TriageAcuity.LEVEL_2:
      return TriageCategory.RED;
    case TriageAcuity.LEVEL_3:
      return TriageCategory.YELLOW;
    default:
      return TriageCategory.GREEN;
  }
}

/** True when `next` is more urgent than `current` (automatic changes only ever raise urgency). */
export function isMoreUrgent(
  next: TriageCategory,
  current: TriageCategory | null,
): boolean {
  return !current || CATEGORY_RANK[next] > CATEGORY_RANK[current];
}

/** An emergency arrival with no colour yet is treated as red until someone triages it. */
export function resolveCheckInCategory(
  visitType: VisitTypeEnum | undefined,
  category: TriageCategory | undefined,
): TriageCategory | null {
  if (category) return category;
  return visitType === VisitTypeEnum.EMERGENCY ? TriageCategory.RED : null;
}

const pad = (value: number, size: number) => String(value).padStart(size, '0');

export function emergencyNumberPrefix(date: Date): string {
  return `EM-${date.getFullYear()}${pad(date.getMonth() + 1, 2)}${pad(date.getDate(), 2)}-`;
}

/** EM-YYYYMMDD-NNN, numbering restarts each day. */
export function nextEmergencyNumber(
  date: Date,
  lastToday: string | null,
): string {
  const prefix = emergencyNumberPrefix(date);
  const last = lastToday?.startsWith(prefix)
    ? Number(lastToday.slice(prefix.length))
    : 0;
  return `${prefix}${pad((Number.isFinite(last) ? last : 0) + 1, 3)}`;
}
