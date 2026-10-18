import { UnprocessableEntityException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserRole } from 'common/enums/userRoles.enum';
import { InventoryItem } from 'src/inventory/entities/inventory-item.entity';
import { LabOrdersService } from 'src/lab/lab-orders.service';
import { PharmacyService } from 'src/pharmacy/pharmacy.service';
import { ConsultationOrdersService } from './consultation-orders.service';
import { ConsultationService } from './consultation.service';
import { ConsultationStatus } from './enums/consultation-status.enum';

const consultations = { findEditable: jest.fn() };
const pharmacy = { createPrescription: jest.fn() };
const items = { findBy: jest.fn() };
const doctor = { id: 'd1', role: UserRole.DOCTOR };
const line = { itemId: 'i1', dosage: '1MU', frequency: 'QID', quantity: 4 };
const withAllergies = (allergies: string | null) => ({
  id: 'c1',
  patientId: 'p1',
  visitId: 'v1',
  doctorId: 'd1',
  status: ConsultationStatus.IN_PROGRESS,
  patient: { allergies },
});

describe('ConsultationOrdersService allergy warning (M-12)', () => {
  let service: ConsultationOrdersService;

  beforeEach(async () => {
    jest.clearAllMocks();
    items.findBy.mockResolvedValue([
      { id: 'i1', name: 'Benzylpenicillin', genericName: null },
    ]);
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConsultationOrdersService,
        { provide: ConsultationService, useValue: consultations },
        { provide: LabOrdersService, useValue: {} },
        { provide: PharmacyService, useValue: pharmacy },
        { provide: getRepositoryToken(InventoryItem), useValue: items },
      ],
    }).compile();
    service = module.get(ConsultationOrdersService);
  });

  it('stops a prescription that matches a recorded allergy', async () => {
    // Arrange
    consultations.findEditable.mockResolvedValue(withAllergies('Penicillin'));

    // Act
    const act = service.prescribe('c1', { items: [line] }, doctor);

    // Assert
    await expect(act).rejects.toBeInstanceOf(UnprocessableEntityException);
    expect(pharmacy.createPrescription).not.toHaveBeenCalled();
  });

  it('records the acknowledged warning on the prescription', async () => {
    // Arrange
    consultations.findEditable.mockResolvedValue(withAllergies('Penicillin'));
    const dto = {
      items: [line],
      notes: 'Benefit outweighs risk',
      allergyAcknowledged: true,
    };

    // Act
    await service.prescribe('c1', dto, doctor);

    // Assert
    expect(pharmacy.createPrescription).toHaveBeenCalledWith(
      expect.objectContaining({
        notes:
          'Allergy warning acknowledged: Benzylpenicillin (allergy: Penicillin).\nBenefit outweighs risk',
      }),
      'd1',
    );
    expect(pharmacy.createPrescription).not.toHaveBeenCalledWith(
      expect.objectContaining({ allergyAcknowledged: true }),
      'd1',
    );
  });

  it('skips the medicine lookup when no allergies are recorded', async () => {
    // Arrange
    consultations.findEditable.mockResolvedValue(withAllergies(null));

    // Act
    await service.prescribe('c1', { items: [line] }, doctor);

    // Assert
    expect(items.findBy).not.toHaveBeenCalled();
    expect(pharmacy.createPrescription).toHaveBeenCalled();
  });
});
