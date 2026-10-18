import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserRole } from 'common/enums/userRoles.enum';
import { DoctorAssignmentService } from 'src/doctors/doctor-assignment.service';
import { ConsultationDiagnosesService } from './consultation-diagnoses.service';
import { ConsultationReferencesService } from './consultation-references.service';
import { ConsultationService } from './consultation.service';
import { Consultation } from './entities/consultation.entity';
import { ConsultationStatus } from './enums/consultation-status.enum';

const manager = {
  save: jest.fn((value: Consultation) => ({ ...value, id: 'c1' })),
};
const consultationsRepo = {
  create: jest.fn((value: Partial<Consultation>) => value),
  findOne: jest.fn(),
  manager: {
    transaction: jest.fn((work: (m: typeof manager) => unknown) =>
      work(manager),
    ),
  },
};
const references = {
  assertPatient: jest.fn(),
  assertAssignableDoctor: jest.fn(),
  assertVisitOfPatient: jest.fn(),
};
const diagnoses = { resolve: jest.fn(), replace: jest.fn() };
const assignment = { claim: jest.fn() };
const doctor = { id: 'd1', role: UserRole.DOCTOR };
const open = {
  id: 'c1',
  doctorId: 'd1',
  status: ConsultationStatus.IN_PROGRESS,
};

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
        { provide: ConsultationReferencesService, useValue: references },
        { provide: ConsultationDiagnosesService, useValue: diagnoses },
        { provide: DoctorAssignmentService, useValue: assignment },
      ],
    }).compile();
    service = module.get(ConsultationService);
  });

  it('stops before saving when the visit belongs to another patient', async () => {
    // Arrange
    references.assertVisitOfPatient.mockRejectedValue(
      new BadRequestException(),
    );

    // Act
    const act = service.open(
      { patientId: 'p1', visitId: 'v1', chiefComplaint: 'Fever' },
      doctor,
    );

    // Assert
    await expect(act).rejects.toBeInstanceOf(BadRequestException);
    expect(manager.save).not.toHaveBeenCalled();
  });

  it('opens a consultation for the signed-in doctor with its diagnoses', async () => {
    // Arrange
    const rows = [{ code: 'B54', isPrimary: true, rank: 0 }];
    diagnoses.resolve.mockResolvedValue(rows);
    consultationsRepo.findOne.mockResolvedValue(open);

    // Act
    await service.open(
      {
        patientId: 'p1',
        chiefComplaint: ' Fever ',
        diagnoses: [{ codeId: 'code-1' }],
      },
      doctor,
    );

    // Assert
    expect(references.assertAssignableDoctor).toHaveBeenCalledWith(
      'd1',
      doctor,
    );
    expect(manager.save).toHaveBeenCalledWith(
      expect.objectContaining({
        doctorId: 'd1',
        chiefComplaint: 'Fever',
        status: ConsultationStatus.IN_PROGRESS,
      }),
    );
    expect(diagnoses.replace).toHaveBeenCalledWith(manager, 'c1', rows);
  });

  it('leaves diagnoses alone when an edit does not send them', async () => {
    // Arrange
    consultationsRepo.findOne.mockResolvedValue({ ...open });

    // Act
    await service.edit('c1', { plan: 'Rest' }, doctor);

    // Assert
    expect(diagnoses.resolve).not.toHaveBeenCalled();
    expect(diagnoses.replace).not.toHaveBeenCalled();
    expect(manager.save).toHaveBeenCalledWith(
      expect.objectContaining({ plan: 'Rest' }),
    );
  });

  it('stops a doctor editing a colleague’s consultation', async () => {
    // Arrange
    consultationsRepo.findOne.mockResolvedValue({ ...open, doctorId: 'd2' });

    // Act
    const act = service.edit('c1', { plan: 'Rest' }, doctor);

    // Assert
    await expect(act).rejects.toBeInstanceOf(ForbiddenException);
    expect(manager.save).not.toHaveBeenCalled();
  });

  it('refuses to edit a signed consultation', async () => {
    // Arrange
    consultationsRepo.findOne.mockResolvedValue({
      ...open,
      status: ConsultationStatus.COMPLETED,
    });

    // Act
    const act = service.edit('c1', { plan: 'Rest' }, doctor);

    // Assert
    await expect(act).rejects.toBeInstanceOf(ConflictException);
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
