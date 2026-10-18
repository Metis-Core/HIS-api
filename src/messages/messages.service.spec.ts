import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AccountStatus } from 'common/enums/userStatus.enum';
import { Visit } from 'src/queue/entities/visit.entity';
import { User } from 'src/users/entities/user.entity';
import { Message } from './entities/message.entity';
import { MessageSentEvent } from './events/message-sent.event';
import { previewOf } from './message-preview';
import { MessagesService } from './messages.service';

const messages = {
  create: jest.fn((value: object) => value),
  save: jest.fn((value: object[]) =>
    Promise.resolve(value.map((row, i) => ({ id: `m${i + 1}`, ...row }))),
  ),
  update: jest.fn(),
  countBy: jest.fn(),
};
const users = { findOneBy: jest.fn(), find: jest.fn() };
const visits = { existsBy: jest.fn() };
const events = { emit: jest.fn() };

const person = (id: string, status = AccountStatus.ACTIVE) => ({
  id,
  username: `user-${id}`,
  status,
});

describe('MessagesService', () => {
  let service: MessagesService;

  beforeEach(async () => {
    jest.clearAllMocks();
    users.findOneBy.mockImplementation(({ id }: { id: string }) =>
      Promise.resolve(person(id)),
    );
    visits.existsBy.mockResolvedValue(true);
    const module = await Test.createTestingModule({
      providers: [
        MessagesService,
        { provide: getRepositoryToken(Message), useValue: messages },
        { provide: getRepositoryToken(User), useValue: users },
        { provide: getRepositoryToken(Visit), useValue: visits },
        { provide: EventEmitter2, useValue: events },
      ],
    }).compile();
    service = module.get(MessagesService);
  });

  it('saves an unread message and tells the recipient', async () => {
    // Act
    await service.send(
      { recipientId: 'r1', body: 'Please see bed 4', visitId: 'v1' },
      's1',
    );

    // Assert
    expect(messages.create).toHaveBeenCalledWith(
      expect.objectContaining({
        senderId: 's1',
        recipientId: 'r1',
        visitId: 'v1',
        readAt: null,
      }),
    );
    expect(events.emit).toHaveBeenCalledWith(
      MessageSentEvent.channel,
      expect.objectContaining({
        recipientId: 'r1',
        senderName: 'user-s1',
        preview: 'Please see bed 4',
      }),
    );
  });

  it('refuses to message yourself, a suspended account, or a visit that does not exist', async () => {
    // Act and assert
    await expect(
      service.send({ recipientId: 's1', body: 'hi' }, 's1'),
    ).rejects.toBeInstanceOf(BadRequestException);

    users.findOneBy.mockImplementation(({ id }: { id: string }) =>
      Promise.resolve(
        person(
          id,
          id === 'r1' ? AccountStatus.SUSPENDED : AccountStatus.ACTIVE,
        ),
      ),
    );
    await expect(
      service.send({ recipientId: 'r1', body: 'hi' }, 's1'),
    ).rejects.toBeInstanceOf(NotFoundException);

    users.findOneBy.mockImplementation(({ id }: { id: string }) =>
      Promise.resolve(person(id)),
    );
    visits.existsBy.mockResolvedValue(false);
    await expect(
      service.send({ recipientId: 'r1', body: 'hi', visitId: 'v9' }, 's1'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(messages.save).not.toHaveBeenCalled();
  });

  it('writes one copy per team member under a shared batch and notifies each', async () => {
    // Arrange
    users.find.mockResolvedValue([{ id: 'p1' }, { id: 'p2' }]);

    // Act
    await service.send({ team: 'pharmacy', body: 'Out of ORS?' }, 's1');

    // Assert
    const rows = messages.save.mock.calls[0][0] as {
      recipientId: string;
      teamRole: string;
      batchId: string;
    }[];
    expect(rows.map((r) => r.recipientId)).toEqual(['p1', 'p2']);
    expect(rows.every((r) => r.teamRole === 'pharmacy')).toBe(true);
    expect(new Set(rows.map((r) => r.batchId)).size).toBe(1);
    expect(events.emit).toHaveBeenCalledTimes(2);
    expect(events.emit).toHaveBeenCalledWith(
      MessageSentEvent.channel,
      expect.objectContaining({ recipientId: 'p2', team: 'pharmacy' }),
    );
  });

  it('refuses a team nobody is in, and a message with no audience', async () => {
    // Arrange
    users.find.mockResolvedValue([]);

    // Act and assert
    await expect(
      service.send({ team: 'accounts', body: 'hi' }, 's1'),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.send({ body: 'hi' }, 's1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('marks only the messages sent to you by that person as read', async () => {
    // Arrange
    messages.update.mockResolvedValue({ affected: 3 });

    // Act
    const result = await service.markRead('me', 'them');

    // Assert
    expect(result).toEqual({ updated: 3 });
    expect(messages.update).toHaveBeenCalledWith(
      expect.objectContaining({ recipientId: 'me', senderId: 'them' }),
      expect.objectContaining({ readAt: expect.any(Date) as Date }),
    );
  });
});

describe('previewOf', () => {
  it('collapses whitespace and shortens long messages', () => {
    expect(previewOf('  Lab   result\nready ')).toBe('Lab result ready');
    const long = previewOf('x'.repeat(300));
    expect(long).toHaveLength(140);
    expect(long.endsWith('…')).toBe(true);
  });
});
