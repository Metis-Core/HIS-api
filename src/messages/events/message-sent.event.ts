import type { MessageTeam } from '../message-teams';

export class MessageSentEvent {
  static readonly channel = 'message.sent';

  constructor(
    readonly messageId: string,
    readonly senderId: string,
    readonly senderName: string,
    readonly recipientId: string,
    readonly preview: string,
    readonly visitId: string | null,
    readonly team: MessageTeam | null = null,
  ) {}
}
