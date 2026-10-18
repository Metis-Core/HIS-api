import { NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { Department } from 'common/enums/department.enum';
import { QueueEntryStatus } from './enums/queue-entry-status.enum';
import { VisitIntenentsEnum } from './enums/visit-type.enum';
import { VisitCheckedInEvent } from './events/visit-checked-in.event';
import { LabOnlyVisitsService } from './lab-only-visits.service';

const qb = {
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  addOrderBy: jest.fn().mockReturnThis(),
  getOne: jest.fn(),
};
const manager = {
  findOneBy: jest.fn(),
  createQueryBuilder: jest.fn(() => qb),
  create: jest.fn((_entity: unknown, value: object) => value),
  save: jest.fn((value: unknown) =>
    Promise.resolve(
      Array.isArray(value) ? value : { id: 'v-new', ...(value as object) },
    ),
  ),
};
const dataSource = {
  transaction: jest.fn((work: (m: typeof manager) => unknown) => work(manager)),
};
const events = { emit: jest.fn() };

describe('LabOnlyVisitsService', () => {
  let service: LabOnlyVisitsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    manager.findOneBy.mockResolvedValue({ id: 'p1' });
    qb.getOne.mockResolvedValue(null);
    const module = await Test.createTestingModule({
      providers: [
        LabOnlyVisitsService,
        { provide: DataSource, useValue: dataSource },
        { provide: EventEmitter2, useValue: events },
      ],
    }).compile();
    service = module.get(LabOnlyVisitsService);
  });

  it('opens a visit that goes from reception straight to the lab', async () => {
    // Arrange / Act
    const visit = await service.checkIn('p1', 'reception-1');

    // Assert
    expect(visit.id).toBe('v-new');
    const entries = manager.save.mock.calls[1][0] as Array<
      Record<string, unknown>
    >;
    expect(entries.map((e) => [e.department, e.status])).toEqual([
      [Department.RECEPTION, QueueEntryStatus.COMPLETED],
      [Department.MAIN_LABORATORY, QueueEntryStatus.WAITING],
    ]);
  });

  it('announces the check-in after commit without a consultation intent', async () => {
    // Arrange / Act
    await service.checkIn('p1', 'reception-1');

    // Assert
    const [channel, event] = events.emit.mock.calls[0] as [
      string,
      VisitCheckedInEvent,
    ];
    expect(channel).toBe(VisitCheckedInEvent.channel);
    expect(event.intents).toEqual([VisitIntenentsEnum.LAB]);
  });

  it('returns the active visit instead of opening a second one', async () => {
    // Arrange
    qb.getOne.mockResolvedValue({ id: 'v-active' });

    // Act
    const visit = await service.checkIn('p1', 'reception-1');

    // Assert
    expect(visit.id).toBe('v-active');
    expect(manager.save).not.toHaveBeenCalled();
    expect(events.emit).not.toHaveBeenCalled();
  });

  it('refuses an unknown patient', async () => {
    // Arrange
    manager.findOneBy.mockResolvedValue(null);

    // Act
    const attempt = service.checkIn('missing', 'reception-1');

    // Assert
    await expect(attempt).rejects.toThrow(NotFoundException);
  });
});
