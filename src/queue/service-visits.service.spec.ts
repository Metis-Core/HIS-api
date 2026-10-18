import { NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { Department } from 'common/enums/department.enum';
import { QueueEntryStatus } from './enums/queue-entry-status.enum';
import { ServiceVisitKind } from './enums/service-visit.enum';
import { VisitIntenentsEnum } from './enums/visit-type.enum';
import { VisitCheckedInEvent } from './events/visit-checked-in.event';
import { LabOnlyVisitsService } from './lab-only-visits.service';
import { QueueEntriesService } from './queue-entries.service';
import { ServiceVisitsService } from './service-visits.service';

const manager = {
  existsBy: jest.fn(),
  create: jest.fn((_entity: unknown, value: object) => value),
  save: jest.fn((value: unknown) =>
    Promise.resolve(
      Array.isArray(value) ? value : { id: 'v-new', ...(value as object) },
    ),
  ),
};
const dataSource = {
  manager,
  transaction: jest.fn((work: (m: typeof manager) => unknown) => work(manager)),
};
const events = { emit: jest.fn() };
const labOnly = { findActive: jest.fn() };
const queueEntries = { ensureIntent: jest.fn() };

describe('ServiceVisitsService', () => {
  let service: ServiceVisitsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    manager.existsBy.mockResolvedValue(true);
    labOnly.findActive.mockResolvedValue(null);
    const module = await Test.createTestingModule({
      providers: [
        ServiceVisitsService,
        { provide: DataSource, useValue: dataSource },
        { provide: EventEmitter2, useValue: events },
        { provide: LabOnlyVisitsService, useValue: labOnly },
        { provide: QueueEntriesService, useValue: queueEntries },
      ],
    }).compile();
    service = module.get(ServiceVisitsService);
  });

  it('opens an immunization visit that goes from reception to the maternal and child clinic, with no consultation', async () => {
    // Act
    await service.checkIn('p1', ServiceVisitKind.IMMUNIZATION, 'n1');

    // Assert
    const stages = (
      manager.save.mock.calls[1][0] as Array<{
        department: Department;
        status: QueueEntryStatus;
      }>
    ).map((entry) => [entry.department, entry.status]);
    expect(stages).toEqual([
      [Department.RECEPTION, QueueEntryStatus.COMPLETED],
      [Department.ANTENATAL, QueueEntryStatus.WAITING],
    ]);
    expect(events.emit).toHaveBeenCalledWith(
      VisitCheckedInEvent.channel,
      expect.objectContaining({ intents: [VisitIntenentsEnum.IMMUNIZATION] }),
    );
  });

  it('adds the stage to a patient who already has an open visit', async () => {
    // Arrange
    labOnly.findActive.mockResolvedValue({ id: 'v-open' });
    manager.existsBy.mockResolvedValueOnce(true).mockResolvedValueOnce(false);

    // Act
    const visit = await service.checkIn('p1', ServiceVisitKind.ANTENATAL, 'n1');

    // Assert
    expect(visit.id).toBe('v-open');
    expect(queueEntries.ensureIntent).toHaveBeenCalledWith(
      'v-open',
      VisitIntenentsEnum.ANTENATAL,
    );
    expect(events.emit).toHaveBeenCalledTimes(1);
  });

  it('does not bill the service twice while it is already queued', async () => {
    // Arrange
    labOnly.findActive.mockResolvedValue({ id: 'v-open' });

    // Act
    await service.checkIn('p1', ServiceVisitKind.ANTENATAL, 'n1');

    // Assert
    expect(queueEntries.ensureIntent).not.toHaveBeenCalled();
    expect(events.emit).not.toHaveBeenCalled();
  });

  it('refuses an unknown patient', async () => {
    // Arrange
    manager.existsBy.mockResolvedValue(false);

    // Act
    const act = service.checkIn('missing', ServiceVisitKind.ANTENATAL, 'n1');

    // Assert
    await expect(act).rejects.toBeInstanceOf(NotFoundException);
  });
});
