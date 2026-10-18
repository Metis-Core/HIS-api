import { UserRole } from 'common/enums/userRoles.enum';
import type { LabOrder } from '../entities/lab-order.entity';
import { LabOrderItemStatus as S } from '../enums/lab-order-item-status.enum';
import { releaseFor } from './release';

const order = () =>
  ({
    items: [
      {
        status: S.VERIFIED,
        resultData: { hb: 9 },
        resultFlags: { hb: 'low' },
        resultNotes: 'n',
        isAbnormal: true,
      },
      {
        status: S.RESULT_READY,
        resultData: { hb: 3 },
        resultFlags: { hb: 'critical_low' },
        resultNotes: 'x',
        isAbnormal: true,
      },
    ],
  }) as unknown as LabOrder;

describe('releaseFor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('hides a result the lab has not verified from a doctor', () => {
    // Arrange
    const o = order();

    // Act
    releaseFor(UserRole.DOCTOR, o);

    // Assert
    expect(o.items[0].resultData).toEqual({ hb: 9 });
    expect(o.items[1]).toMatchObject({
      resultData: null,
      resultFlags: null,
      resultNotes: null,
      isAbnormal: false,
    });
  });

  it('shows lab staff their work in progress', () => {
    // Arrange
    const o = order();

    // Act
    releaseFor(UserRole.LAB_TECH, [o]);

    // Assert
    expect(o.items[1].resultData).toEqual({ hb: 3 });
  });
});
