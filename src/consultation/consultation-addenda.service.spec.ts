import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserRole } from 'common/enums/userRoles.enum';
import { ConsultationAddendaService } from './consultation-addenda.service';
import { ConsultationService } from './consultation.service';
import { ConsultationAddendum } from './entities/consultation-addendum.entity';
import { ConsultationStatus } from './enums/consultation-status.enum';

const addenda = {
  create: jest.fn((value: Partial<ConsultationAddendum>) => value),
  save: jest.fn((value: Partial<ConsultationAddendum>) => ({
    ...value,
    id: 'a1',
  })),
  findOneOrFail: jest.fn(),
  findAndCount: jest.fn(),
};
const consultations = { findEditable: jest.fn(), findOne: jest.fn() };
const doctor = { id: 'd1', role: UserRole.DOCTOR };

describe('ConsultationAddendaService', () => {
  let service: ConsultationAddendaService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConsultationAddendaService,
        {
          provide: getRepositoryToken(ConsultationAddendum),
          useValue: addenda,
        },
        { provide: ConsultationService, useValue: consultations },
      ],
    }).compile();
    service = module.get(ConsultationAddendaService);
  });

  it('adds a trimmed addendum signed by the author', async () => {
    // Arrange
    consultations.findEditable.mockResolvedValue({
      status: ConsultationStatus.COMPLETED,
    });

    // Act
    await service.add('c1', { body: '  Lab confirmed malaria ' }, doctor);

    // Assert
    expect(addenda.save).toHaveBeenCalledWith({
      consultationId: 'c1',
      authorId: 'd1',
      body: 'Lab confirmed malaria',
    });
  });

  it('refuses an addendum before the encounter is signed', async () => {
    // Arrange
    consultations.findEditable.mockResolvedValue({
      status: ConsultationStatus.IN_PROGRESS,
    });

    // Act
    const act = service.add('c1', { body: 'Note' }, doctor);

    // Assert
    await expect(act).rejects.toBeInstanceOf(BadRequestException);
    expect(addenda.save).not.toHaveBeenCalled();
  });

  it('lists addenda newest first', async () => {
    // Arrange
    addenda.findAndCount.mockResolvedValue([[], 0]);

    // Act
    await service.list('c1', { page: 2, limit: 5 });

    // Assert
    expect(addenda.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({
        order: { createdAt: 'DESC', id: 'DESC' },
        skip: 5,
        take: 5,
      }),
    );
  });
});
