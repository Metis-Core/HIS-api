import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserRole } from 'common/enums/userRoles.enum';
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
const users = { findOne: jest.fn() };
const doctor = { id: 'd1', role: UserRole.DOCTOR };

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
        { provide: UsersService, useValue: users },
      ],
    }).compile();
    service = module.get(ConsultationService);
  });

  it('refuses a visit that belongs to another patient', async () => {
    // Arrange
    users.findOne.mockResolvedValue(doctor);
    visitsRepo.findOne.mockResolvedValue({ id: 'v1', patientId: 'other' });

    // Act
    const act = service.open(
      { patientId: 'p1', visitId: 'v1', chiefComplaint: 'Fever' },
      doctor,
    );

    // Assert
    await expect(act).rejects.toBeInstanceOf(BadRequestException);
    expect(consultationsRepo.save).not.toHaveBeenCalled();
  });

  it('refuses to assign a consultation to a non-doctor', async () => {
    // Arrange
    users.findOne.mockResolvedValue({ id: 'r1', role: UserRole.RECEPTIONIST });
    const admin = { id: 'a1', role: UserRole.ADMIN };

    // Act
    const act = service.open(
      { patientId: 'p1', doctorId: 'r1', chiefComplaint: 'Fever' },
      admin,
    );

    // Assert
    await expect(act).rejects.toBeInstanceOf(BadRequestException);
    expect(consultationsRepo.save).not.toHaveBeenCalled();
  });

  it('stops a doctor editing a colleague’s consultation', async () => {
    // Arrange
    consultationsRepo.findOne.mockResolvedValue({ id: 'c1', doctorId: 'd2' });

    // Act
    const act = service.edit('c1', { plan: 'Rest' }, doctor);

    // Assert
    await expect(act).rejects.toBeInstanceOf(ForbiddenException);
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
