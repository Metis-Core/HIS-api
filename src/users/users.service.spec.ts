import { BadRequestException, ConflictException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserRole } from 'common/enums/userRoles.enum';
import { AccountStatus } from 'common/enums/userStatus.enum';
import { PasswordService } from 'common/services/password.service';
import { UserAccountChangedEvent } from './events/user-account-changed.event';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  const queryBuilder = {
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
  };
  const repository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(() => queryBuilder),
  };
  const passwords = { hash: jest.fn(), verify: jest.fn() };
  const events = { emit: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: repository,
        },
        {
          provide: PasswordService,
          useValue: passwords,
        },
        { provide: EventEmitter2, useValue: events },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('account changes', () => {
    const admin = { id: 'admin-1', role: UserRole.ADMIN };
    const doctor = () => ({
      id: 'doc-1',
      role: UserRole.DOCTOR,
      status: AccountStatus.ACTIVE,
    });

    it('announces a suspension so waiting patients are moved', async () => {
      repository.findOne.mockResolvedValue(doctor());
      repository.save.mockImplementation((user: unknown) => user);

      await service.updateAsActor(
        'doc-1',
        { status: AccountStatus.SUSPENDED },
        admin as never,
      );

      expect(events.emit).toHaveBeenCalledWith(
        UserAccountChangedEvent.channel,
        new UserAccountChangedEvent('doc-1'),
      );
    });

    it('stays quiet when neither role nor status changed', async () => {
      repository.findOne.mockResolvedValue(doctor());
      repository.save.mockImplementation((user: unknown) => user);

      await service.updateAsActor(
        'doc-1',
        { department: undefined },
        admin as never,
      );

      expect(events.emit).not.toHaveBeenCalled();
    });

    it('announces a deletion', async () => {
      repository.findOne.mockResolvedValue(doctor());

      await service.removeAsActor('doc-1', admin as never);

      expect(events.emit).toHaveBeenCalledWith(
        UserAccountChangedEvent.channel,
        new UserAccountChangedEvent('doc-1'),
      );
    });
  });

  describe('updateOwnProfile', () => {
    it('changes the username after the current password is confirmed', async () => {
      // Arrange
      const user = { id: 'u1', username: 'old', passwordHash: 'h' };
      queryBuilder.getOne.mockResolvedValue(user);
      passwords.verify.mockResolvedValue(true);
      repository.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 'u1', username: 'newname' });

      // Act
      await service.updateOwnProfile('u1', {
        username: 'newname',
        currentPassword: 'pw',
      });

      // Assert
      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({ username: 'newname' }),
      );
    });

    it('rejects a wrong current password with 400', async () => {
      // Arrange
      queryBuilder.getOne.mockResolvedValue({ id: 'u1', passwordHash: 'h' });
      passwords.verify.mockResolvedValue(false);

      // Act
      const act = service.updateOwnProfile('u1', {
        username: 'newname',
        currentPassword: 'bad',
      });

      // Assert
      await expect(act).rejects.toBeInstanceOf(BadRequestException);
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('rejects a username already used by someone else', async () => {
      // Arrange
      queryBuilder.getOne.mockResolvedValue({ id: 'u1', passwordHash: 'h' });
      passwords.verify.mockResolvedValue(true);
      repository.findOne.mockResolvedValue({ id: 'u2' });

      // Act
      const act = service.updateOwnProfile('u1', {
        username: 'taken',
        currentPassword: 'pw',
      });

      // Assert
      await expect(act).rejects.toBeInstanceOf(ConflictException);
    });
  });
});
