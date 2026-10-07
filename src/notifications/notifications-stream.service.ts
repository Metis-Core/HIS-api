import { Injectable, MessageEvent } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Observable, Subject, filter, interval, map, merge, startWith } from 'rxjs';
import type { Notification } from './entities/notification.entity';
import { NotificationCreatedEvent } from './events/notification-created.event';

const HEARTBEAT_MS = 25_000;

/**
 * Bridges persisted notifications to live SSE clients. The database stays the
 * source of truth; a dropped connection is repaired by the client refetching.
 * In-memory fan-out: run a shared pub/sub (e.g. Redis) before scaling to multiple API instances.
 */
@Injectable()
export class NotificationsStreamService {
  private readonly created$ = new Subject<Notification>();

  @OnEvent(NotificationCreatedEvent.name)
  onNotificationCreated(event: NotificationCreatedEvent): void {
    this.created$.next(event.notification);
  }

  streamFor(userId: string): Observable<MessageEvent> {
    const notifications$ = this.created$.pipe(
      filter((n) => n.userId === userId),
      map((n): MessageEvent => ({ type: 'notification', id: n.id, data: n })),
    );
    // Heartbeats keep proxies from closing the idle connection; the first one flushes headers immediately.
    const heartbeat$ = interval(HEARTBEAT_MS).pipe(
      startWith(0),
      map((): MessageEvent => ({ type: 'ping', data: {} })),
    );
    return merge(notifications$, heartbeat$);
  }
}
