import {
  BadRequestException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { resolveException } from './all-exceptions.filter';

const queryError = (code: string) =>
  new QueryFailedError(
    'INSERT INTO patients ...',
    ['Jane Doe'],
    Object.assign(new Error('raw'), { code }),
  );

describe('resolveException', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('keeps the status and message of an HttpException', () => {
    // Arrange
    const exception = new NotFoundException('Patient not found');
    // Act
    const result = resolveException(exception);
    // Assert
    expect(result).toEqual({
      status: HttpStatus.NOT_FOUND,
      body: { code: 'NOT_FOUND', message: 'Patient not found' },
    });
  });

  it('joins validation messages and returns them as details', () => {
    // Arrange
    const exception = new BadRequestException([
      'name is required',
      'phone is required',
    ]);
    // Act
    const result = resolveException(exception);
    // Assert
    expect(result.status).toBe(HttpStatus.BAD_REQUEST);
    expect(result.body.message).toBe('name is required, phone is required');
    expect(result.body.details).toEqual([
      'name is required',
      'phone is required',
    ]);
  });

  it('maps a unique violation to 409 without leaking SQL', () => {
    // Arrange
    const exception = queryError('23505');
    // Act
    const result = resolveException(exception);
    // Assert
    expect(result.status).toBe(HttpStatus.CONFLICT);
    expect(JSON.stringify(result.body)).not.toContain('INSERT');
    expect(JSON.stringify(result.body)).not.toContain('Jane');
  });

  it('maps unknown database errors to a generic 500', () => {
    // Arrange
    const exception = queryError('XX000');
    // Act
    const result = resolveException(exception);
    // Assert
    expect(result).toEqual({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      body: { code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' },
    });
  });

  it('hides the message of unexpected errors', () => {
    // Arrange
    const exception = new Error('connection to 10.0.0.5 refused');
    // Act
    const result = resolveException(exception);
    // Assert
    expect(result.body.message).toBe('Internal server error');
  });
});
