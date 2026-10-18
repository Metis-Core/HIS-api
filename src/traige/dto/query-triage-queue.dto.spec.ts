import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { TriageStatus } from '../enums/triage-status.enum';
import { QueryTriageQueueDTO } from './query-triage-queue.dto';

describe('QueryTriageQueueDTO', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('accepts an open status', async () => {
    // Arrange
    const dto = plainToInstance(QueryTriageQueueDTO, {
      status: TriageStatus.IN_PROGRESS,
    });

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors).toHaveLength(0);
  });

  it('rejects finished statuses so the live queue cannot return all history', async () => {
    // Arrange
    const dto = plainToInstance(QueryTriageQueueDTO, {
      status: TriageStatus.COMPLETED,
    });

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.map((e) => e.property)).toEqual(['status']);
  });
});
