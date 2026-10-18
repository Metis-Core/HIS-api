import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PatientsService } from 'src/patients/patients.service';
import { Visit } from 'src/queue/entities/visit.entity';
import { UsersService } from 'src/users/users.service';
import { ConsultationService } from './consultation.service';
import { Consultation } from './entities/consultation.entity';

const consultationsRepo = {
  create: jest.fn((value: Partial<Consultation>) => value),
  save: jest.fn((value: Partial<Consultation>) => ({ ...value, id: 'c1' })),
  findOne: jest.fn(),
};
const visitsRepo = { findOne: jest.fn() };

describe('ConsultationService', () => {
  let service: ConsultationService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConsultationService,
        {
          provide: getRepositoryToken(Consultation),
          useValue: consultationsRepo,
        },
        { provide: getRepositoryToken(Visit), useValue: visitsRepo },
        { provide: PatientsService, useValue: { findOne: jest.fn() } },
        { provide: UsersService, useValue: { findOne: jest.fn() } },
      ],
    }).compile();
    service = module.get(ConsultationService);
  });

  it('refuses a visit that belongs to another patient', async () => {
    // Arrange
    visitsRepo.findOne.mockResolvedValue({ id: 'v1', patientId: 'other' });

    // Act
    const act = service.create(
      { patientId: 'p1', visitId: 'v1', chiefComplaint: 'Fever' },
      'd1',
    );

    // Assert
    await expect(act).rejects.toBeInstanceOf(BadRequestException);
    expect(consultationsRepo.save).not.toHaveBeenCalled();
  });

  it('reports a missing consultation as not found', async () => {
    // Arrange
    consultationsRepo.findOne.mockResolvedValue(null);

    // Act
    const act = service.findOne('missing');

    // Assert
    await expect(act).rejects.toBeInstanceOf(NotFoundException);
  });
});
