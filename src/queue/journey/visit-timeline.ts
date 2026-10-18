import { Department } from 'common/enums/department.enum';
import { QueueEntryStatus } from '../enums/queue-entry-status.enum';

export interface TimelineSource {
  id: string;
  department: Department;
  status: QueueEntryStatus;
  sequenceNumber: number;
  createdAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
  servedById: string | null;
  servedBy?: { username: string } | null;
  metadata?: { review?: boolean } | null;
}

export interface TimelineStage {
  entryId: string;
  department: Department;
  status: QueueEntryStatus;
  review: boolean;
  servedById: string | null;
  servedByName: string | null;
  /** When the patient became free to be seen here (previous stage finished). */
  readyAt: Date | null;
  startedAt: Date | null;
  completedAt: Date | null;
  waitSeconds: number | null;
  serviceSeconds: number | null;
}

export interface VisitTimeline {
  stages: TimelineStage[];
  totalSeconds: number | null;
}

const seconds = (from: Date, to: Date): number =>
  Math.max(0, Math.round((to.getTime() - from.getTime()) / 1000));

const FINISHED: readonly QueueEntryStatus[] = [
  QueueEntryStatus.COMPLETED,
  QueueEntryStatus.SKIPPED,
];

/** Per-stage waiting and service time, measured from when the previous stage finished. */
export function buildVisitTimeline(
  entries: readonly TimelineSource[],
  now: Date,
): VisitTimeline {
  const ordered = [...entries].sort(
    (a, b) => a.sequenceNumber - b.sequenceNumber,
  );
  let previousDoneAt: Date | null = null;
  let previousFinished = true;

  const stages = ordered.map((entry, index): TimelineStage => {
    const readyAt =
      index === 0
        ? entry.createdAt
        : previousFinished && previousDoneAt
          ? new Date(
              Math.max(entry.createdAt.getTime(), previousDoneAt.getTime()),
            )
          : null;
    const finished = FINISHED.includes(entry.status);
    const waitEnd =
      entry.startedAt ?? (finished ? entry.completedAt : readyAt ? now : null);
    const serviceEnd = entry.completedAt ?? now;

    previousFinished = finished;
    previousDoneAt = entry.completedAt;

    return {
      entryId: entry.id,
      department: entry.department,
      status: entry.status,
      review: entry.metadata?.review === true,
      servedById: entry.servedById,
      servedByName: entry.servedBy?.username ?? null,
      readyAt,
      startedAt: entry.startedAt,
      completedAt: entry.completedAt,
      waitSeconds: readyAt && waitEnd ? seconds(readyAt, waitEnd) : null,
      serviceSeconds: entry.startedAt
        ? seconds(entry.startedAt, serviceEnd)
        : null,
    };
  });

  const first = ordered[0];
  const last = ordered[ordered.length - 1];
  const end = last && FINISHED.includes(last.status) ? last.completedAt : now;
  return {
    stages,
    totalSeconds: first && end ? seconds(first.createdAt, end) : null,
  };
}
