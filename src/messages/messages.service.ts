import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
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
import { MESSAGE_TEAMS, MessageTeam } from './message-teams';
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

export interface TeamConversation {
  team: MessageTeam;
  label: string;
  lastMessage: {
    body: string;
    createdAt: Date;
    mine: boolean;
    senderName: string;
  };
  unread: number;
}

interface TeamRow {
  team: MessageTeam;
  body: string;
  senderId: string;
  senderName: string;
  createdAt: Date;
}

// One copy per member shares a batchId; the reader sees their own copy, the sender the first.
const VISIBLE_TEAM_MESSAGES = `m.id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY "batchId" ORDER BY ("recipientId" = :userId) DESC, id) AS rn
    FROM messages
    WHERE "teamRole" = :team AND ("recipientId" = :userId OR "senderId" = :userId) AND "deletedAt" IS NULL
  ) ranked WHERE rn = 1
)`;

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
    if (!dto.team && !dto.recipientId) {
      throw new BadRequestException('Choose a person or a team');
    }
    if (dto.team && dto.recipientId) {
      throw new BadRequestException('Choose a person or a team, not both');
    }
    if (dto.recipientId === senderId) {
      throw new BadRequestException('You cannot message yourself');
    }
    const sender = await this.users.findOneBy({ id: senderId });
    if (!sender) throw new NotFoundException('Sender not found');
    if (dto.visitId && !(await this.visits.existsBy({ id: dto.visitId }))) {
      throw new NotFoundException('Visit not found');
    }
    const recipientIds = dto.team
      ? await this.teamMemberIds(dto.team, senderId)
      : [await this.personId(dto.recipientId as string)];
    const batchId = randomUUID();
    const saved = await this.messages.save(
      recipientIds.map((recipientId) =>
        this.messages.create({
          senderId,
          recipientId,
          body: dto.body,
          visitId: dto.visitId ?? null,
          readAt: null,
          teamRole: dto.team ?? null,
          batchId: dto.team ? batchId : null,
        }),
      ),
    );
    for (const message of saved) {
      this.events.emit(
        MessageSentEvent.channel,
        new MessageSentEvent(
          message.id,
          senderId,
          sender.username,
          message.recipientId,
          previewOf(message.body),
          message.visitId,
          dto.team ?? null,
        ),
      );
    }
    return saved[0];
  }

  private async personId(id: string): Promise<string> {
    const recipient = await this.users.findOneBy({ id });
    if (!recipient || recipient.status !== AccountStatus.ACTIVE) {
      throw new NotFoundException('That person cannot receive messages');
    }
    return recipient.id;
  }

  private async teamMemberIds(
    team: MessageTeam,
    senderId: string,
  ): Promise<string[]> {
    const members = await this.users.find({
      where: {
        status: AccountStatus.ACTIVE,
        role: In([...MESSAGE_TEAMS[team].roles]),
        id: Not(senderId),
      },
      select: { id: true },
    });
    if (members.length === 0) {
      throw new BadRequestException(
        `Nobody in ${MESSAGE_TEAMS[team].label} can receive messages yet`,
      );
    }
    return members.map((member) => member.id);
  }

  async conversations(userId: string): Promise<Conversation[]> {
    const rows = await this.messages.query<LastMessageRow[]>(
      `SELECT DISTINCT ON (other) other AS "otherId", body, "senderId", "createdAt"
       FROM (
         SELECT body, "senderId", "createdAt", id,
           CASE WHEN "senderId" = $1 THEN "recipientId" ELSE "senderId" END AS other
         FROM messages
         WHERE ("senderId" = $1 OR "recipientId" = $1) AND "teamRole" IS NULL AND "deletedAt" IS NULL
       ) m
       ORDER BY other, "createdAt" DESC, id DESC`,
      [userId],
    );
    if (rows.length === 0) return [];
    const unreadRows = await this.messages
      .createQueryBuilder('m')
      .select('m.senderId', 'senderId')
      .addSelect('COUNT(*)', 'count')
      .where(
        'm.recipientId = :userId AND m.readAt IS NULL AND m.teamRole IS NULL',
        {
          userId,
        },
      )
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
        { senderId: userId, recipientId: otherId, teamRole: IsNull() },
        { senderId: otherId, recipientId: userId, teamRole: IsNull() },
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
      {
        recipientId: userId,
        senderId: otherId,
        teamRole: IsNull(),
        readAt: IsNull(),
      },
      { readAt: new Date() },
    );
    return { updated: result.affected ?? 0 };
  }

  async teamConversations(userId: string): Promise<TeamConversation[]> {
    const rows = await this.messages.query<TeamRow[]>(
      `SELECT DISTINCT ON (x."teamRole") x."teamRole" AS team, x.body, x."senderId",
         u.username AS "senderName", x."createdAt"
       FROM (
         SELECT m.*, ROW_NUMBER() OVER (PARTITION BY m."batchId" ORDER BY (m."recipientId" = $1) DESC, m.id) AS rn
         FROM messages m
         WHERE m."teamRole" IS NOT NULL AND (m."recipientId" = $1 OR m."senderId" = $1) AND m."deletedAt" IS NULL
       ) x
       JOIN users u ON u.id = x."senderId"
       WHERE x.rn = 1
       ORDER BY x."teamRole", x."createdAt" DESC, x.id DESC`,
      [userId],
    );
    if (rows.length === 0) return [];
    const unreadRows = await this.messages
      .createQueryBuilder('m')
      .select('m.teamRole', 'team')
      .addSelect('COUNT(*)', 'count')
      .where('m.recipientId = :userId AND m.readAt IS NULL', { userId })
      .andWhere('m.teamRole IS NOT NULL')
      .groupBy('m.teamRole')
      .getRawMany<{ team: string; count: string }>();
    const unread = new Map(unreadRows.map((r) => [r.team, Number(r.count)]));
    return rows
      .map((row) => ({
        team: row.team,
        label: MESSAGE_TEAMS[row.team].label,
        lastMessage: {
          body: row.body,
          createdAt: row.createdAt,
          mine: row.senderId === userId,
          senderName: row.senderName,
        },
        unread: unread.get(row.team) ?? 0,
      }))
      .sort(
        (a, b) =>
          b.lastMessage.createdAt.getTime() - a.lastMessage.createdAt.getTime(),
      );
  }

  /** Newest first, each message with its sender so the reader can tell who wrote it. */
  async teamThread(
    userId: string,
    team: MessageTeam,
    query: PaginationQueryDTO,
  ): Promise<IPagination<Message>> {
    const window = pageWindow(query);
    const [items, total] = await this.messages
      .createQueryBuilder('m')
      .leftJoin('m.sender', 's')
      .addSelect(['s.id', 's.username', 's.role'])
      .where(VISIBLE_TEAM_MESSAGES, { userId, team })
      .orderBy('m.createdAt', 'DESC')
      .addOrderBy('m.id', 'DESC')
      .skip(window.skip)
      .take(window.take)
      .getManyAndCount();
    return toPage(items, total, window);
  }

  async markTeamRead(
    userId: string,
    team: MessageTeam,
  ): Promise<{ updated: number }> {
    const result = await this.messages.update(
      { recipientId: userId, teamRole: team, readAt: IsNull() },
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
