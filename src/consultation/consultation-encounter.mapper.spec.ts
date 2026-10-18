import {
  encounterChanges,
  headerChanges,
} from './consultation-encounter.mapper';

describe('consultation encounter mapper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('trims text and turns an emptied field into null', () => {
    // Arrange
    const input = { plan: '  Rest  ', notes: '   ' };

    // Act
    const changes = encounterChanges(input);

    // Assert
    expect(changes).toEqual({ plan: 'Rest', notes: null });
  });

  it('leaves out fields that were not sent', () => {
    // Arrange
    const input = { diagnosis: 'Malaria' };

    // Act
    const changes = encounterChanges(input);

    // Assert
    expect(Object.keys(changes)).toEqual(['diagnosis']);
  });

  it('clears an emptied follow-up date and keeps unsent header fields out', () => {
    // Arrange
    const input = { followUpDate: '' };

    // Act
    const changes = headerChanges(input);

    // Assert
    expect(changes).toEqual({ followUpDate: null });
  });
});
