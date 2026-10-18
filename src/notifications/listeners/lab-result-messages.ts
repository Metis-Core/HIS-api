import type { LabResultVerifiedEvent } from 'src/lab/events/lab-result-verified.event';
import { NotificationPriority } from '../enums/notification-priority.enum';

export function resultPriority(
  critical: boolean,
  flagged: boolean,
): NotificationPriority {
  if (critical) return NotificationPriority.CRITICAL;
  return flagged ? NotificationPriority.HIGH : NotificationPriority.NORMAL;
}

/** Wording for a single verified (or amended) result sent to the ordering clinician. */
export function verifiedMessage(
  event: LabResultVerifiedEvent,
  patient: string,
): { title: string; body: string } {
  const test = event.testName;
  if (event.amended) {
    return {
      title: `Amended result: ${test}`,
      body: `${patient}: the verified ${test} result was corrected. Please review it.`,
    };
  }
  if (event.critical) {
    return {
      title: `Critical result: ${test}`,
      body: `${patient}: ${test} is verified with a critical value. Other tests on this order are still pending.`,
    };
  }
  const range = event.flagged ? ' with values outside the reference range' : '';
  return {
    title: `Result verified: ${test}`,
    body: `${patient}: ${test} is verified${range}. Other tests on this order are still pending.`,
  };
}
