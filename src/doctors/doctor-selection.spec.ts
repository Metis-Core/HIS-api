import { AvailabilityStatus } from 'common/enums/availability-status.enum';
import { DoctorCandidate, pickDoctor } from './doctor-selection';

const doctor = (
  id: string,
  overrides: Partial<DoctorCandidate> = {},
): DoctorCandidate => ({
  id,
  availability: AvailabilityStatus.AVAILABLE,
  waiting: 0,
  lastAssignedAt: null,
  ...overrides,
});

describe('pickDoctor', () => {
  it('returns null when nobody can take a patient', () => {
    expect(pickDoctor([])).toBeNull();
    expect(
      pickDoctor([
        doctor('a', { availability: AvailabilityStatus.ON_LEAVE }),
        doctor('b', { availability: AvailabilityStatus.OUT_OF_OFFICE }),
      ]),
    ).toBeNull();
  });

  it('gives the patient to the doctor with the fewest waiting', () => {
    const picked = pickDoctor([
      doctor('a', { waiting: 4 }),
      doctor('b', { waiting: 1 }),
      doctor('c', { waiting: 2 }),
    ]);
    expect(picked).toBe('b');
  });

  it('spreads patients evenly across doctors over repeated assignments', () => {
    const doctors = [doctor('a'), doctor('b'), doctor('c')];
    const counts: Record<string, number> = { a: 0, b: 0, c: 0 };
    for (let i = 0; i < 9; i++) {
      const id = pickDoctor(doctors)!;
      counts[id]++;
      const picked = doctors.find((d) => d.id === id)!;
      picked.waiting++;
      picked.lastAssignedAt = new Date(1_000 + i);
    }
    expect(counts).toEqual({ a: 3, b: 3, c: 3 });
  });

  it('uses a busy doctor only when nobody is available', () => {
    const busyIdle = doctor('busy', { availability: AvailabilityStatus.BUSY });
    const freeLoaded = doctor('free', { waiting: 5 });
    expect(pickDoctor([busyIdle, freeLoaded])).toBe('free');
    expect(pickDoctor([busyIdle])).toBe('busy');
  });

  it('never picks a doctor on leave or out of office', () => {
    const picked = pickDoctor([
      doctor('leave', { availability: AvailabilityStatus.ON_LEAVE }),
      doctor('away', { availability: AvailabilityStatus.OUT_OF_OFFICE }),
      doctor('here', { waiting: 9 }),
    ]);
    expect(picked).toBe('here');
  });

  it('breaks ties by who was given a patient longest ago', () => {
    const picked = pickDoctor([
      doctor('recent', { lastAssignedAt: new Date('2026-10-18T08:55:00Z') }),
      doctor('older', { lastAssignedAt: new Date('2026-10-18T08:10:00Z') }),
      doctor('never'),
    ]);
    expect(picked).toBe('never');
  });

  it('skips the excluded doctor', () => {
    expect(pickDoctor([doctor('a'), doctor('b', { waiting: 3 })], 'a')).toBe(
      'b',
    );
    expect(pickDoctor([doctor('a')], 'a')).toBeNull();
  });
});
