import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, In, IsNull, Not, Repository } from 'typeorm';
import { AccountStatus } from 'common/enums/userStatus.enum';
import { PaginationQueryDTO, pageWindow, toPage } from 'common/pagination';
import { IPagination } from 'common/response-format';
import { Visit } from 'src/queue/entities/visit.entity';
import { User } from 'src/users/entities/user.entity';
import { QueryContactsDto } from './dto/query-contacts.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { Message } from './entities/message.entity';
import { MessageSentEvent } from './events/message-sent.event';
import { previewOf } from './message-preview';

const CONVERSATION_LIMIT = 50;
const CONTACT_LIMIT = 20;

export interface Contact {
  id: string;
  username: string;
  role: User['role'];
}

export interface Conversation {
  user: Contact;
  lastMessage: { body: string; createdAt: Date; mine: boolean };
  unread: number;
}

interface LastMessageRow {
  otherId: string;
  body: string;
  senderId: string;
  createdAt: Date;
}

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly messages: Repository<Message>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(Visit)
    private readonly visits: Repository<Visit>,
    private readonly events: EventEmitter2,
  ) {}

  async send(dto: SendMessageDto, senderId: string): Promise<Message> {
    if (dto.recipientId === senderId) {
      throw new BadRequestException('You cannot message yourself');
    }
    const [sender, recipient] = await Promise.all([
      this.users.findOneBy({ id: senderId }),
      this.users.findOneBy({ id: dto.recipientId }),
    ]);
    if (!sender) throw new NotFoundException('Sender not found');
    if (!recipient || recipient.status !== AccountStatus.ACTIVE) {
      throw new NotFoundException('That person cannot receive messages');
    }
    if (dto.visitId && !(await this.visits.existsBy({ id: dto.visitId }))) {
      throw new NotFoundException('Visit not found');
    }
    const saved = await this.messages.save(
      this.messages.create({
        senderId,
        recipientId: recipient.id,
        body: dto.body,
        visitId: dto.visitId ?? null,
        readAt: null,
      }),
    );
    this.events.emit(
      MessageSentEvent.channel,
      new MessageSentEvent(
        saved.id,
        senderId,
        sender.username,
        recipient.id,
        previewOf(saved.body),
        saved.visitId,
      ),
    );
    return saved;
  }

  async conversations(userId: string): Promise<Conversation[]> {
    const rows = await this.messages.query<LastMessageRow[]>(
      `SELECT DISTINCT ON (other) other AS "otherId", body, "senderId", "createdAt"
       FROM (
         SELECT body, "senderId", "createdAt", id,
           CASE WHEN "senderId" = $1 THEN "recipientId" ELSE "senderId" END AS other
         FROM messages
         WHERE ("senderId" = $1 OR "recipientId" = $1) AND "deletedAt" IS NULL
       ) m
       ORDER BY other, "createdAt" DESC, id DESC`,
      [userId],
    );
    if (rows.length === 0) return [];
    const unreadRows = await this.messages
      .createQueryBuilder('m')
      .select('m.senderId', 'senderId')
      .addSelect('COUNT(*)', 'count')
      .where('m.recipientId = :userId AND m.readAt IS NULL', { userId })
      .groupBy('m.senderId')
      .getRawMany<{ senderId: string; count: string }>();
    const unread = new Map(
      unreadRows.map((r) => [r.senderId, Number(r.count)]),
    );
    const people = await this.users.find({
      where: { id: In(rows.map((r) => r.otherId)) },
      select: { id: true, username: true, role: true },
    });
    const byId = new Map(people.map((p) => [p.id, p]));
    return rows
      .filter((row) => byId.has(row.otherId))
      .map((row) => ({
        user: this.contact(byId.get(row.otherId) as User),
        lastMessage: {
          body: row.body,
          createdAt: row.createdAt,
          mine: row.senderId === userId,
        },
        unread: unread.get(row.otherId) ?? 0,
      }))
      .sort(
        (a, b) =>
          b.lastMessage.createdAt.getTime() - a.lastMessage.createdAt.getTime(),
      )
      .slice(0, CONVERSATION_LIMIT);
  }

  /** Newest first; the caller reverses for display. */
  async thread(
    userId: string,
    otherId: string,
    query: PaginationQueryDTO,
  ): Promise<IPagination<Message>> {
    const window = pageWindow(query);
    const [items, total] = await this.messages.findAndCount({
      where: [
        { senderId: userId, recipientId: otherId },
        { senderId: otherId, recipientId: userId },
      ],
      order: { createdAt: 'DESC', id: 'DESC' },
      skip: window.skip,
      take: window.take,
    });
    return toPage(items, total, window);
  }

  async markRead(
    userId: string,
    otherId: string,
  ): Promise<{ updated: number }> {
    const result = await this.messages.update(
      { recipientId: userId, senderId: otherId, readAt: IsNull() },
      { readAt: new Date() },
    );
    return { updated: result.affected ?? 0 };
  }

  async unread(userId: string): Promise<{ unread: number }> {
    return {
      unread: await this.messages.countBy({
        recipientId: userId,
        readAt: IsNull(),
      }),
    };
  }

  /** Active staff the caller can message, newest accounts last. */
  async contacts(userId: string, query: QueryContactsDto): Promise<Contact[]> {
    const search = query.search?.trim();
    const people = await this.users.find({
      where: {
        status: AccountStatus.ACTIVE,
        id: Not(userId),
        ...(search && {
          username: ILike(`%${search.replace(/[%_\\]/g, '\\$&')}%`),
        }),
      },
      select: { id: true, username: true, role: true },
      order: { username: 'ASC' },
      take: CONTACT_LIMIT,
    });
    return people.map((person) => this.contact(person));
  }

  async contactById(userId: string, id: string): Promise<Contact> {
    const person = await this.users.findOne({
      where: { id, status: AccountStatus.ACTIVE },
      select: { id: true, username: true, role: true },
    });
    if (!person || person.id === userId) {
      throw new NotFoundException('That person cannot receive messages');
    }
    return this.contact(person);
  }

  private contact(user: User): Contact {
    return { id: user.id, username: user.username, role: user.role };
  }
}
