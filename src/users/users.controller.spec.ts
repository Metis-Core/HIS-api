import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { RoleGroups } from 'common/access/role-groups';
import { ROLES_KEY } from 'common/decorators/roles.decorator';
import { UserRole } from 'common/enums/userRoles.enum';
import type { AuthenticatedUser } from 'common/interfaces/authenticated-user.interface';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

const usersServiceMock = {
  findOne: jest.fn(),
  updateAsActor: jest.fn(),
  removeAsActor: jest.fn(),
  search: jest.fn(),
};

const nurse = { id: 'nurse-1', role: UserRole.NURSE } as AuthenticatedUser;

describe('UsersController', () => {
  let controller: UsersController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: usersServiceMock }],
    }).compile();
    controller = module.get<UsersController>(UsersController);
  });

  it('restricts PATCH /users/:id to administrators', () => {
    // Arrange
    const reflector = new Reflector();
    // Act
    const roles = reflector.get<unknown>(
      ROLES_KEY,
      Object.getOwnPropertyDescriptor(UsersController.prototype, 'update')
        ?.value as () => unknown,
    );
    // Assert
    expect(roles).toEqual(RoleGroups.ADMINS.roles);
  });

  it('forbids a non-admin from reading another user', async () => {
    // Arrange
    const otherId = '9c0d1c8e-0000-4000-8000-000000000000';
    // Act
    const act = controller.findOne(otherId, nurse);
    // Assert
    await expect(act).rejects.toThrow(ForbiddenException);
    expect(usersServiceMock.findOne).not.toHaveBeenCalled();
  });

  it('passes the acting user to the service on update', async () => {
    // Arrange
    usersServiceMock.updateAsActor.mockResolvedValue({ id: 'u-1' });
    const admin = { id: 'admin-1', role: UserRole.ADMIN } as AuthenticatedUser;
    // Act
    await controller.update('u-1', { role: UserRole.DOCTOR }, admin);
    // Assert
    expect(usersServiceMock.updateAsActor).toHaveBeenCalledWith(
      'u-1',
      { role: UserRole.DOCTOR },
      admin,
    );
  });
});
