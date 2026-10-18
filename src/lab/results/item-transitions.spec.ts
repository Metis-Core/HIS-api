import { ConflictException } from '@nestjs/common';
import { LabOrderItemStatus as S } from '../enums/lab-order-item-status.enum';
import { assertTransition } from './item-transitions';

describe('assertTransition', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each([
    [S.PENDING, S.COLLECTED],
    [S.PENDING, S.RESULT_READY],
    [S.COLLECTED, S.IN_PROCESS],
    [S.RESULT_READY, S.RESULT_READY],
  ])('allows %s → %s', (from, to) => {
    // Arrange / Act
    const run = () => assertTransition(from, to);

    // Assert
    expect(run).not.toThrow();
  });

  it.each([
    [S.VERIFIED, S.RESULT_READY],
    [S.CANCELLED, S.COLLECTED],
    [S.IN_PROCESS, S.PENDING],
  ])('blocks %s → %s', (from, to) => {
    // Arrange / Act
    const run = () => assertTransition(from, to);

    // Assert
    expect(run).toThrow(ConflictException);
  });
});
