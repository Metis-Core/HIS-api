import { Injectable, MessageEvent } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  Observable,
  Subject,
  auditTime,
  filter,
  interval,
  map,
  merge,
  startWith,
} from 'rxjs';
import { DoctorAssignedEvent } from 'src/doctors/events/doctor-assigned.event';
import { QUEUE_EVENT_PATTERN } from 'src/queue/events/queue.events';
import { VisitCheckedInEvent } from 'src/queue/events/visit-checked-in.event';
import type { Notification } from './entities/notification.entity';
import { NotificationCreatedEvent } from './events/notification-created.event';

const HEARTBEAT_MS = 25_000;
const QUEUE_SIGNAL_WINDOW_MS = 500;

/**
 * Bridges persisted notifications to live SSE clients. The database stays the
 * source of truth; a dropped connection is repaired by the client refetching.
 * In-memory fan-out: run a shared pub/sub (e.g. Redis) before scaling to multiple API instances.
 */
@Injectable()
export class NotificationsStreamService {
  private readonly created$ = new Subject<Notification>();
  private readonly queueChanged$ = new Subject<void>();

  @OnEvent(NotificationCreatedEvent.name)
  onNotificationCreated(event: NotificationCreatedEvent): void {
    this.created$.next(event.notification);
  }

  @OnEvent(QUEUE_EVENT_PATTERN)
  @OnEvent(VisitCheckedInEvent.channel)
  @OnEvent(DoctorAssignedEvent.channel)
  onQueueChanged(): void {
    this.queueChanged$.next();
  }

  streamFor(userId: string): Observable<MessageEvent> {
    const notifications$ = this.created$.pipe(
      filter((n) => n.userId === userId),
      map((n): MessageEvent => ({ type: 'notification', id: n.id, data: n })),
    );
    const queue$ = this.queueChanged$.pipe(
      auditTime(QUEUE_SIGNAL_WINDOW_MS),
      map((): MessageEvent => ({ type: 'queue-changed', data: {} })),
    );
    // Heartbeats keep proxies from closing the idle connection; the first one flushes headers immediately.
    const heartbeat$ = interval(HEARTBEAT_MS).pipe(
      startWith(0),
      map((): MessageEvent => ({ type: 'ping', data: {} })),
    );
    return merge(notifications$, queue$, heartbeat$);
  }
}
