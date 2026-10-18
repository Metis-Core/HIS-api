import { ConflictException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Service } from './entities/service.entity';
import { ServiceCode } from './service-codes';
import { ServicesService } from './services.service';

describe('ServicesService', () => {
  const queryBuilder = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
  };
  const repository = {
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(() => queryBuilder),
  };
  let service: ServicesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ServicesService(repository as unknown as Repository<Service>);
  });

  describe('findConsultationService', () => {
    it('returns the active service carrying the CONSULTATION code', async () => {
      // Arrange
      const coded = { id: 's1', code: ServiceCode.CONSULTATION } as Service;
      repository.findOne.mockResolvedValue(coded);

      // Act
      const result = await service.findConsultationService();

      // Assert
      expect(result).toBe(coded);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { code: ServiceCode.CONSULTATION, isActive: true },
      });
      expect(repository.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('falls back to the legacy name match when no service has the code', async () => {
      // Arrange
      const legacy = { id: 's2', name: 'Consultation' } as Service;
      repository.findOne.mockResolvedValue(null);
      queryBuilder.getOne.mockResolvedValue(legacy);

      // Act
      const result = await service.findConsultationService();

      // Assert
      expect(result).toBe(legacy);
    });
  });

  describe('update', () => {
    it('rejects a code already used by another service', async () => {
      // Arrange
      repository.findOne.mockResolvedValue({ id: 'other' });

      // Act
      const act = service.update('mine', { code: ServiceCode.CONSULTATION });

      // Assert
      await expect(act).rejects.toBeInstanceOf(ConflictException);
    });
  });
});
