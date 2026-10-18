import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from 'common/enums/userRoles.enum';
import { LabOrdersService } from 'src/lab/lab-orders.service';
import { PharmacyService } from 'src/pharmacy/pharmacy.service';
import { ConsultationOrdersService } from './consultation-orders.service';
import { ConsultationService } from './consultation.service';
import { ConsultationStatus } from './enums/consultation-status.enum';

const consultations = { findEditable: jest.fn() };
const labOrders = { createOrder: jest.fn() };
const pharmacy = { createPrescription: jest.fn() };
const doctor = { id: 'd1', role: UserRole.DOCTOR };
const openConsultation = {
  id: 'c1',
  patientId: 'p1',
  visitId: 'v1',
  doctorId: 'd1',
  status: ConsultationStatus.IN_PROGRESS,
};
const line = { itemId: 'i1', dosage: '500mg', frequency: 'TDS', quantity: 15 };

describe('ConsultationOrdersService', () => {
  let service: ConsultationOrdersService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConsultationOrdersService,
        { provide: ConsultationService, useValue: consultations },
        { provide: LabOrdersService, useValue: labOrders },
        { provide: PharmacyService, useValue: pharmacy },
      ],
    }).compile();
    service = module.get(ConsultationOrdersService);
  });

  it('passes the visit so the pharmacy queue gets the patient', async () => {
    // Arrange
    consultations.findEditable.mockResolvedValue(openConsultation);

    // Act
    await service.prescribe('c1', { items: [line] }, doctor);

    // Assert
    expect(pharmacy.createPrescription).toHaveBeenCalledWith(
      {
        items: [line],
        patientId: 'p1',
        consultationId: 'c1',
        visitId: 'v1',
      },
      'd1',
    );
  });

  it('links a lab order to the consultation’s patient and visit', async () => {
    // Arrange
    consultations.findEditable.mockResolvedValue(openConsultation);

    // Act
    await service.orderLabs('c1', { items: [{ testId: 't1' }] }, doctor);

    // Assert
    expect(labOrders.createOrder).toHaveBeenCalledWith(
      expect.objectContaining({ patientId: 'p1', visitId: 'v1' }),
      'd1',
    );
  });

  it('refuses orders on a signed consultation', async () => {
    // Arrange
    consultations.findEditable.mockResolvedValue({
      ...openConsultation,
      status: ConsultationStatus.COMPLETED,
    });

    // Act
    const act = service.orderLabs('c1', { items: [{ testId: 't1' }] }, doctor);

    // Assert
    await expect(act).rejects.toBeInstanceOf(ConflictException);
    expect(labOrders.createOrder).not.toHaveBeenCalled();
  });
});
