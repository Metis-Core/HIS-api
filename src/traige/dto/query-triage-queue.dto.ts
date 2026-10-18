import { IsIn, IsOptional } from 'class-validator';
import { TriageStatus } from '../enums/triage-status.enum';

// The live queue only holds open triages; finished ones grow forever, so they are read through the paged GET /triage.
export const TRIAGE_QUEUE_STATUSES = [
  TriageStatus.WAITING,
  TriageStatus.IN_PROGRESS,
] as const;

export class QueryTriageQueueDTO {
  @IsOptional()
  @IsIn(TRIAGE_QUEUE_STATUSES, {
    message:
      'status must be WAITING or IN_PROGRESS; use GET /triage for finished triages',
  })
  status?: (typeof TRIAGE_QUEUE_STATUSES)[number];
}
