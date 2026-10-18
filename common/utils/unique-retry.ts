import { QueryFailedError } from 'typeorm';

const UNIQUE_VIOLATION = '23505';

export const isUniqueViolation = (error: unknown): boolean =>
  error instanceof QueryFailedError &&
  (error.driverError as { code?: string })?.code === UNIQUE_VIOLATION;

export async function retryOnUniqueViolation<T>(
  work: () => Promise<T>,
  attempts = 3,
): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await work();
    } catch (error) {
      if (!isUniqueViolation(error) || attempt >= attempts) throw error;
    }
  }
}
