import { ConflictException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { Gender } from 'common/enums/gender.enum';
import { LabOrderItem } from './entities/lab-order-item.entity';
import { LabResultAmendment } from './entities/lab-result-amendment.entity';
import { LabOrderItemStatus as S } from './enums/lab-order-item-status.enum';
import { LabResultReadyEvent } from './events/lab-result-ready.event';
import { LabResultVerifiedEvent } from './events/lab-result-verified.event';
import { LabOrderProgressService } from './lab-order-progress.service';
import { LabOrdersService } from './lab-orders.service';
import { LabResultsService } from './lab-results.service';

const hbTest = {
  name: 'Haemoglobin',
  resultSchema: {
    fields: [
      {
        key: 'hb',
        label: 'Hb',
        type: 'number',
        required: true,
        ranges: [{ low: 12, high: 16, criticalLow: 7 }],
      },
    ],
  },
};
const makeItem = (overrides: Partial<LabOrderItem> = {}) =>
  ({
    id: 'i1',
    orderId: 'o1',
    status: S.COLLECTED,
    resultData: null,
    resultFlags: null,
    resultNotes: null,
    isAbnormal: false,
    collectedAt: null,
    verifiedAt: null,
    test: hbTest,
    order: {
      patientId: 'p1',
      orderedById: 'doc',
      patient: { gender: Gender.FEMALE, dateOfBirth: '1990-01-01' },
    },
    ...overrides,
  }) as unknown as LabOrderItem;

const manager = {
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn((_e: unknown, v: object) => v),
};
const dataSource = {
  transaction: jest.fn((work: (m: typeof manager) => unknown) => work(manager)),
};
const emitter = { emit: jest.fn() };
const progress = { reconcile: jest.fn() };
const labOrders = { findOne: jest.fn() };

describe('LabResultsService', () => {
  let service: LabResultsService;
  let item: LabOrderItem;

  beforeEach(async () => {
    jest.clearAllMocks();
    item = makeItem();
    manager.findOne.mockImplementation(() => Promise.resolve(item));
    progress.reconcile.mockResolvedValue(false);
    const module = await Test.createTestingModule({
      providers: [
        LabResultsService,
        { provide: DataSource, useValue: dataSource },
        { provide: EventEmitter2, useValue: emitter },
        { provide: LabOrderProgressService, useValue: progress },
        { provide: LabOrdersService, useValue: labOrders },
      ],
    }).compile();
    service = module.get(LabResultsService);
  });

  it('stores validated values, computes flags and announces the result for verification', async () => {
    // Arrange
    const dto = { status: S.RESULT_READY, resultData: { hb: 6.2 } };

    // Act
    await service.updateItem('o1', 'i1', dto, 'tech');

    // Assert
    expect(item).toMatchObject({
      status: S.RESULT_READY,
      resultData: { hb: 6.2 },
      resultFlags: { hb: 'critical_low' },
      isAbnormal: true,
      resultedById: 'tech',
    });
    expect(emitter.emit).toHaveBeenCalledWith(
      LabResultReadyEvent.name,
      expect.objectContaining({ resultedById: 'tech' }),
    );
  });

  it('refuses to mark a result ready while a required value is missing', async () => {
    // Arrange
    const dto = { status: S.RESULT_READY, resultData: {} };

    // Act
    const run = service.updateItem('o1', 'i1', dto, 'tech');

    // Assert
    await expect(run).rejects.toMatchObject({
      response: { message: ['Hb is required'] },
    });
    expect(manager.save).not.toHaveBeenCalled();
  });

  it('locks verified results against direct edits', async () => {
    // Arrange
    item = makeItem({ status: S.VERIFIED, resultData: { hb: 13 } });

    // Act
    const run = service.updateItem(
      'o1',
      'i1',
      { resultData: { hb: 14 } },
      'tech',
    );

    // Assert
    await expect(run).rejects.toBeInstanceOf(ConflictException);
  });

  it('verifies a ready result, records who and when, and alerts the doctor', async () => {
    // Arrange
    item = makeItem({ status: S.RESULT_READY, resultData: { hb: 13 } });

    // Act
    await service.verify('o1', 'i1', 'senior');

    // Assert
    expect(item.status).toBe(S.VERIFIED);
    expect(item.verifiedById).toBe('senior');
    expect(item.verifiedAt).toBeInstanceOf(Date);
    expect(emitter.emit).toHaveBeenCalledWith(
      LabResultVerifiedEvent.name,
      expect.objectContaining({ orderedById: 'doc' }),
    );
  });

  it('leaves the alert to the order-completed event when verification finishes the order', async () => {
    // Arrange
    item = makeItem({ status: S.RESULT_READY, resultData: { hb: 13 } });
    progress.reconcile.mockResolvedValue(true);

    // Act
    await service.verify('o1', 'i1', 'senior');

    // Assert
    expect(emitter.emit).not.toHaveBeenCalledWith(
      LabResultVerifiedEvent.name,
      expect.anything(),
    );
  });

  it('will not verify a result that has not been entered', async () => {
    // Arrange
    item = makeItem({ status: S.COLLECTED });

    // Act
    const run = service.verify('o1', 'i1', 'senior');

    // Assert
    await expect(run).rejects.toThrow(
      'Only an entered result that is ready can be verified',
    );
  });

  it('amends a verified result and keeps the previous values in the trail', async () => {
    // Arrange
    item = makeItem({
      status: S.VERIFIED,
      resultData: { hb: 13 },
      verifiedById: 'senior',
    });
    const dto = { resultData: { hb: 11 }, reason: 'Transcription error' };

    // Act
    await service.amend('o1', 'i1', dto, 'chief');

    // Assert
    expect(manager.save).toHaveBeenCalledWith(
      LabResultAmendment,
      expect.objectContaining({
        previousData: { hb: 13 },
        newData: { hb: 11 },
        reason: 'Transcription error',
        amendedById: 'chief',
      }),
    );
    expect(item).toMatchObject({
      resultFlags: { hb: 'low' },
      verifiedById: 'chief',
    });
    expect(emitter.emit).toHaveBeenCalledWith(
      LabResultVerifiedEvent.name,
      expect.objectContaining({ amended: true }),
    );
  });

  it('sends unverified results to normal editing instead of amendment', async () => {
    // Arrange
    item = makeItem({ status: S.RESULT_READY, resultData: { hb: 13 } });

    // Act
    const run = service.amend(
      'o1',
      'i1',
      { resultData: { hb: 12 }, reason: 'typo fix' },
      'chief',
    );

    // Assert
    await expect(run).rejects.toThrow(
      'This result is not verified yet; edit it directly',
    );
  });
});
