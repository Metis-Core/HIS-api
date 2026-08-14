import { ParseEnumPipe } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Department } from 'common/enums/department.enum';
import { QUEUE_EVENT_PATTERN, QueueEvent } from './events/queue.events';
import { QueueService } from './queue.service';

@WebSocketGateway({ namespace: 'queue', cors: { origin: '*' } })
export class QueueGateway {
  @WebSocketServer()
  private readonly server: Server;

  constructor(private readonly queueService: QueueService) {}

  @SubscribeMessage('watchDepartment')
  async watchDepartment(
    @ConnectedSocket() client: Socket,
    @MessageBody(new ParseEnumPipe(Department)) department: Department,
  ): Promise<{ department: Department; board: unknown }> {
    client.join(this.room(department));
    return { department, board: await this.queueService.getDisplayBoard(department) };
  }

  @OnEvent(QUEUE_EVENT_PATTERN)
  async broadcast(event: QueueEvent): Promise<void> {
    const { department } = event.data;
    const board = await this.queueService.getDisplayBoard(department);
    this.server.to(this.room(department)).emit('queueUpdated', {
      department,
      event: event.channel,
      data: event.data,
      board,
      occurredAt: event.occurredAt,
    });
  }

  private room(department: Department): string {
    return `department:${department}`;
  }
}
