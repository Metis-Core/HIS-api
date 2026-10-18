import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { EntityManager } from 'typeorm';
import { Department } from 'common/enums/department.enum';
import { AfterCommit } from 'common/events/after-commit';
import { QueueEntriesService } from 'src/queue/queue-entries.service';
import { LabOrder } from './entities/lab-order.entity';
import { LabOrderItemStatus as S } from './enums/lab-order-item-status.enum';
import { LabOrderStatus } from './enums/lab-order-status.enum';
import { LabOrderCompletedEvent } from './events/lab-order-completed.event';
import { LabOrderProgressService } from './lab-order-progress.service';

const manager = { findOneOrFail: jest.fn(), find: jest.fn(), save: jest.fn() };
const orders = { count: jest.fn() };
const queueEntries = { completeCurrentFor: jest.fn() };
const emitter = { emit: jest.fn() };

describe('LabOrderProgressService', () => {
  let service: LabOrderProgressService;
  let order: Partial<LabOrder>;

  beforeEach(async () => {
    jest.clearAllMocks();
    order = {
      id: 'o1',
      patientId: 'p1',
      orderedById: 'doc',
      visitId: 'v1',
      status: LabOrderStatus.IN_PROGRESS,
    };
    manager.findOneOrFail.mockImplementation(() => Promise.resolve(order));
    const module = await Test.createTestingModule({
      providers: [
        LabOrderProgressService,
        { provide: getRepositoryToken(LabOrder), useValue: orders },
        { provide: QueueEntriesService, useValue: queueEntries },
      ],
    }).compile();
    service = module.get(LabOrderProgressService);
  });

  const reconcile = async () => {
    const after = new AfterCommit();
    const completed = await service.reconcile(
      manager as unknown as EntityManager,
      after,
      'o1',
    );
    await after.flush(emitter as never);
    return completed;
  };

  it('does not complete an order while a result is only ready, not verified', async () => {
    // Arrange
    manager.find.mockResolvedValue([
      { status: S.VERIFIED },
      { status: S.RESULT_READY },
    ]);

    // Act
    const completed = await reconcile();

    // Assert
    expect(completed).toBe(false);
    expect(order.status).toBe(LabOrderStatus.IN_PROGRESS);
  });

  it('completes on the last verification, counts flags and frees the lab stage', async () => {
    // Arrange
    manager.find.mockResolvedValue([
      {
        status: S.VERIFIED,
        isAbnormal: true,
        resultFlags: { hb: 'critical_low' },
      },
      { status: S.CANCELLED },
    ]);
    orders.count.mockResolvedValue(0);

    // Act
    const completed = await reconcile();

    // Assert
    expect(completed).toBe(true);
    expect(order.status).toBe(LabOrderStatus.COMPLETED);
    expect(queueEntries.completeCurrentFor).toHaveBeenCalledWith(
      'v1',
      Department.MAIN_LABORATORY,
    );
    expect(emitter.emit).toHaveBeenCalledWith(
      LabOrderCompletedEvent.name,
      expect.objectContaining({ abnormalCount: 1, criticalCount: 1 }),
    );
  });

  it('keeps the lab stage open while another lab order on the visit is still open', async () => {
    // Arrange
    manager.find.mockResolvedValue([{ status: S.VERIFIED, isAbnormal: false }]);
    orders.count.mockResolvedValue(1);

    // Act
    await reconcile();

    // Assert
    expect(queueEntries.completeCurrentFor).not.toHaveBeenCalled();
  });

  it('moves a pending order to in progress once a sample is collected', async () => {
    // Arrange
    order.status = LabOrderStatus.PENDING;
    manager.find.mockResolvedValue([
      { status: S.COLLECTED },
      { status: S.PENDING },
    ]);

    // Act
    await reconcile();

    // Assert
    expect(order.status).toBe(LabOrderStatus.IN_PROGRESS);
  });
});
