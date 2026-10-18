import { BadRequestException } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { AfterCommit } from 'common/events/after-commit';
import { Consultation } from 'src/consultation/entities/consultation.entity';
import { Visit } from 'src/queue/entities/visit.entity';
import { VisitStatusEnum } from 'src/queue/enums/visit-status.enum';
import { LabOnlyVisitsService } from 'src/queue/lab-only-visits.service';
import { resolveOrderVisit } from './resolve-order-visit';

const rows = new Map<unknown, unknown>();
const manager = {
  findOneBy: jest.fn((entity: unknown) =>
    Promise.resolve(rows.get(entity) ?? null),
  ),
} as unknown as EntityManager;
const labOnly = { findActive: jest.fn(), open: jest.fn() };
const visits = labOnly as unknown as LabOnlyVisitsService;
const after = new AfterCommit();
const resolve = (links: Parameters<typeof resolveOrderVisit>[1]) =>
  resolveOrderVisit(manager, links, 'tech', after, visits);

describe('resolveOrderVisit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    rows.clear();
  });

  it('uses the consultation visit when a doctor orders from a consultation', async () => {
    // Arrange
    rows.set(Consultation, { id: 'c1', patientId: 'p1', visitId: 'v1' });
    rows.set(Visit, {
      id: 'v1',
      patientId: 'p1',
      status: VisitStatusEnum.OPEN,
    });

    // Act
    const links = await resolve({ patientId: 'p1', consultationId: 'c1' });

    // Assert
    expect(links).toEqual({ consultationId: 'c1', visitId: 'v1' });
    expect(labOnly.open).not.toHaveBeenCalled();
  });

  it('rejects a consultation that belongs to another patient', async () => {
    // Arrange
    rows.set(Consultation, {
      id: 'c1',
      patientId: 'someone-else',
      visitId: 'v1',
    });

    // Act
    const attempt = resolve({ patientId: 'p1', consultationId: 'c1' });

    // Assert
    await expect(attempt).rejects.toThrow(BadRequestException);
  });

  it('rejects a closed visit', async () => {
    // Arrange
    rows.set(Visit, {
      id: 'v1',
      patientId: 'p1',
      status: VisitStatusEnum.COMPLETED,
    });

    // Act
    const attempt = resolve({ patientId: 'p1', visitId: 'v1' });

    // Assert
    await expect(attempt).rejects.toThrow(/closed/);
  });

  it("attaches a walk-in order to the patient's active visit", async () => {
    // Arrange
    labOnly.findActive.mockResolvedValue({ id: 'v-active' });

    // Act
    const links = await resolve({ patientId: 'p1' });

    // Assert
    expect(links).toEqual({ consultationId: null, visitId: 'v-active' });
    expect(labOnly.open).not.toHaveBeenCalled();
  });

  it('opens a lab-only visit when the walk-in has no active visit', async () => {
    // Arrange
    labOnly.findActive.mockResolvedValue(null);
    labOnly.open.mockResolvedValue({ id: 'v-new' });

    // Act
    const links = await resolve({ patientId: 'p1' });

    // Assert
    expect(links.visitId).toBe('v-new');
    expect(labOnly.open).toHaveBeenCalledWith(manager, 'p1', 'tech', after);
  });
});
