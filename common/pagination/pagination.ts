import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { buildPaginationMeta, IPagination } from '../response-format';

export const DEFAULT_PAGE_SIZE = 20;
// Large enough for one screen of a picker, small enough that no request can pull a whole table.
export const MAX_PAGE_SIZE = 100;

export class PaginationQueryDTO {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'page must be a whole number' })
  @Min(1, { message: 'page starts at 1' })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit must be a whole number' })
  @Min(1, { message: 'limit must be at least 1' })
  @Max(MAX_PAGE_SIZE, { message: `limit cannot exceed ${MAX_PAGE_SIZE}` })
  limit?: number = DEFAULT_PAGE_SIZE;
}

export interface IPageWindow {
  readonly page: number;
  readonly limit: number;
  readonly skip: number;
  readonly take: number;
}

/** Turns page/limit (possibly missing or out of range) into a safe skip/take window. */
export function pageWindow(
  query: { page?: number; limit?: number } = {},
): IPageWindow {
  const page = Math.max(1, Math.floor(Number(query.page) || 1));
  const rawLimit = Math.floor(Number(query.limit) || DEFAULT_PAGE_SIZE);
  const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, rawLimit));
  return { page, limit, skip: (page - 1) * limit, take: limit };
}

/** Wraps one page of rows in the standard IPagination contract (items + meta). */
export function toPage<T>(
  items: T[],
  total: number,
  window: IPageWindow,
): IPagination<T> {
  return {
    items,
    total,
    meta: buildPaginationMeta(total, window.skip, window.take),
  };
}
