import { ConflictException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PatientsService } from 'src/patients/patients.service';
import { UsersService } from 'src/users/users.service';
import { QueueEntry } from './entities/queue-entry.entity';
import { Visit } from './entities/visit.entity';
import { VisitTypeEnum } from './enums/visit-type.enum';
import { VisitsService } from './visit.service';

const qb = {
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  addOrderBy: jest.fn().mockReturnThis(),
  getOne: jest.fn(),
};
const visits = {
  manager: { createQueryBuilder: jest.fn(() => qb) },
  create: jest.fn((value: object) => value),
  save: jest.fn(),
};

describe('VisitsService.create', () => {
  let service: VisitsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        VisitsService,
        { provide: getRepositoryToken(Visit), useValue: visits },
        {
          provide: getRepositoryToken(QueueEntry),
          useValue: { save: jest.fn() },
        },
        {
          provide: PatientsService,
          useValue: {
            findByStringId: jest.fn().mockResolvedValue({ id: 'p1' }),
          },
        },
        {
          provide: UsersService,
          useValue: { findOne: jest.fn().mockResolvedValue({ id: 'u1' }) },
        },
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
      ],
    }).compile();
    service = module.get(VisitsService);
  });

  it('refuses a second visit while one is still open', async () => {
    // Arrange
    qb.getOne.mockResolvedValue({ id: 'v-open' });

    // Act
    const act = service.create({
      patientId: 'p1',
      visitType: VisitTypeEnum.WALK_IN,
      handler: 'u1',
    });

    // Assert
    await expect(act).rejects.toBeInstanceOf(ConflictException);
    expect(visits.save).not.toHaveBeenCalled();
  });
});
