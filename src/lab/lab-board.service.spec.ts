import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { LabOrderItem } from './entities/lab-order-item.entity';
import { LabOrderItemStatus as S } from './enums/lab-order-item-status.enum';
import { LabBoardService } from './lab-board.service';

const qb = {
  select: jest.fn().mockReturnThis(),
  addSelect: jest.fn().mockReturnThis(),
  groupBy: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  getRawMany: jest.fn(),
};
const items = { createQueryBuilder: jest.fn(() => qb) };

describe('LabBoardService.summary', () => {
  let service: LabBoardService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        LabBoardService,
        { provide: getRepositoryToken(LabOrderItem), useValue: items },
      ],
    }).compile();
    service = module.get(LabBoardService);
  });

  it('counts each board column and fills empty ones with zero', async () => {
    // Arrange
    qb.getRawMany.mockResolvedValue([
      { status: S.COLLECTED, count: '3' },
      { status: S.VERIFIED, count: '7' },
    ]);

    // Act
    const summary = await service.summary({});

    // Assert
    expect(summary).toEqual({
      [S.PENDING]: 0,
      [S.COLLECTED]: 3,
      [S.IN_PROCESS]: 0,
      [S.RESULT_READY]: 0,
      [S.VERIFIED]: 7,
      [S.CANCELLED]: 0,
    });
  });

  it('limits the counts to the chosen days', async () => {
    // Arrange
    qb.getRawMany.mockResolvedValue([]);

    // Act
    await service.summary({ from: '2026-10-18', to: '2026-10-18' });

    // Assert
    expect(qb.andWhere).toHaveBeenCalledTimes(2);
  });
});
