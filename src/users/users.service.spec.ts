import { BadRequestException, ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PasswordService } from 'common/services/password.service';
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
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
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
