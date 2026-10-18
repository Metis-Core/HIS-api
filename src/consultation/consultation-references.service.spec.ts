import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserRole } from 'common/enums/userRoles.enum';
import { PatientsService } from 'src/patients/patients.service';
import { Visit } from 'src/queue/entities/visit.entity';
import { UsersService } from 'src/users/users.service';
import { ConsultationReferencesService } from './consultation-references.service';

const visits = { findOne: jest.fn() };
const users = { findOne: jest.fn() };

describe('ConsultationReferencesService', () => {
  let service: ConsultationReferencesService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConsultationReferencesService,
        { provide: getRepositoryToken(Visit), useValue: visits },
        { provide: PatientsService, useValue: { findOne: jest.fn() } },
        { provide: UsersService, useValue: users },
      ],
    }).compile();
    service = module.get(ConsultationReferencesService);
  });

  it('refuses a visit that belongs to another patient', async () => {
    // Arrange
    visits.findOne.mockResolvedValue({ id: 'v1', patientId: 'other' });

    // Act
    const act = service.assertVisitOfPatient('v1', 'p1');

    // Assert
    await expect(act).rejects.toBeInstanceOf(BadRequestException);
  });

  it('reports an unknown visit as not found', async () => {
    // Arrange
    visits.findOne.mockResolvedValue(null);

    // Act
    const act = service.assertVisitOfPatient('v1', 'p1');

    // Assert
    await expect(act).rejects.toBeInstanceOf(NotFoundException);
  });

  it('refuses to assign a consultation to a non-doctor', async () => {
    // Arrange
    users.findOne.mockResolvedValue({ id: 'r1', role: UserRole.RECEPTIONIST });
    const admin = { id: 'a1', role: UserRole.ADMIN };

    // Act
    const act = service.assertAssignableDoctor('r1', admin);

    // Assert
    await expect(act).rejects.toBeInstanceOf(BadRequestException);
  });
});
