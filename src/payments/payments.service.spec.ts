import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ServicesService } from 'src/services/services.service';
import { VisitCharge } from './entities/visit-charge.entity';
import { ChargeSource, ChargeStatus } from './enums/charge.enum';
import { PaymentsService } from './payments.service';

describe('PaymentsService', () => {
  let service: PaymentsService;
  const repository = {
    create: jest.fn((v) => v),
    save: jest.fn(async (v) => v),
    find: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
  };
  const servicesService = {
    findOne: jest.fn(),
    findConsultationService: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: getRepositoryToken(VisitCharge), useValue: repository },
        { provide: ServicesService, useValue: servicesService },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  it('prices a catalog service from its fee times quantity', async () => {
    servicesService.findOne.mockResolvedValue({ id: 's1', name: 'Dressing', fee: 5000 });
    const charge = await service.addCharge({ visitId: 'v1', serviceId: 's1', quantity: 2 }, 'u1');
    expect(charge).toMatchObject({ source: ChargeSource.SERVICE, unitPrice: 5000, amount: 10000 });
  });

  it('records an ad-hoc charge from description and unit price', async () => {
    const charge = await service.addCharge({ visitId: 'v1', description: ' Splint ', unitPrice: 7000 }, 'u1');
    expect(charge).toMatchObject({ source: ChargeSource.OTHER, description: 'Splint', amount: 7000 });
  });

  it('bills each lab test at its own price', async () => {
    const rows = await service.addLabCharges(
      'v1',
      [
        { itemId: 'i1', testName: 'Haemogram', price: 20000 },
        { itemId: 'i2', testName: 'Urinalysis', price: 8000 },
      ],
      'u1',
    );
    expect(rows.map((r) => r.amount)).toEqual([20000, 8000]);
  });

  it('skips the consultation fee when no consultation service is priced', async () => {
    servicesService.findConsultationService.mockResolvedValue(null);
    await expect(service.addConsultationFee('v1', 'u1')).resolves.toBeNull();
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('excludes waived charges from totals', async () => {
    repository.find.mockResolvedValue([
      { amount: 10000, status: ChargeStatus.PAID },
      { amount: 5000, status: ChargeStatus.PENDING },
      { amount: 3000, status: ChargeStatus.WAIVED },
    ]);
    await expect(service.billForVisit('v1')).resolves.toMatchObject({ total: 15000, outstanding: 5000 });
  });
});
