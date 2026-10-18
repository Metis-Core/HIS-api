import { VisitIntenentsEnum } from 'src/queue/enums/visit-type.enum';
import { VisitCheckedInEvent } from 'src/queue/events/visit-checked-in.event';
import { DoctorAssignmentListener } from './doctor-assignment.listener';
import { DoctorAssignmentService } from './doctor-assignment.service';

const assignment = {
  assignRequested: jest.fn(),
  assignEmergency: jest.fn(),
  assignIfNeeded: jest.fn(),
};
const listener = new DoctorAssignmentListener(
  assignment as unknown as DoctorAssignmentService,
);

const checkedIn = (
  intents: VisitIntenentsEnum[],
  preferredDoctorId: string | null = null,
) => new VisitCheckedInEvent('v1', 'p1', 'r1', intents, preferredDoctorId);

describe('DoctorAssignmentListener check-in', () => {
  beforeEach(() => jest.clearAllMocks());

  it('gives the patient to the doctor they asked for', async () => {
    // Act
    await listener.onVisitCheckedIn(
      checkedIn(
        [VisitIntenentsEnum.EXAMINATION, VisitIntenentsEnum.CONSULTATION],
        'd1',
      ),
    );

    // Assert
    expect(assignment.assignRequested).toHaveBeenCalledWith('v1', 'd1', 'r1');
    expect(assignment.assignIfNeeded).not.toHaveBeenCalled();
  });

  it('picks a doctor straight away when there is no triage before the consultation', async () => {
    // Act
    await listener.onVisitCheckedIn(
      checkedIn([VisitIntenentsEnum.CONSULTATION]),
    );

    // Assert
    expect(assignment.assignIfNeeded).toHaveBeenCalledWith('v1');
  });

  it('leaves the choice to triage when triage comes first', async () => {
    // Act
    await listener.onVisitCheckedIn(
      checkedIn([
        VisitIntenentsEnum.EXAMINATION,
        VisitIntenentsEnum.CONSULTATION,
      ]),
    );

    // Assert
    expect(assignment.assignIfNeeded).not.toHaveBeenCalled();
  });

  it('assigns no doctor to a visit with no consultation', async () => {
    // Act
    await listener.onVisitCheckedIn(
      checkedIn(
        [VisitIntenentsEnum.EXAMINATION, VisitIntenentsEnum.SURGERY],
        'd1',
      ),
    );

    // Assert
    expect(assignment.assignRequested).not.toHaveBeenCalled();
    expect(assignment.assignIfNeeded).not.toHaveBeenCalled();
  });
});
