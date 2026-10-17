export enum responseStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
}

export interface IPaginationMeta {
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly hasNextPage: boolean;
}

export type IPagination<T> = {
  readonly items: T[];
  readonly total: number;
  readonly meta?: IPaginationMeta;
};

export interface ApiErrorBody {
  readonly code: string;
  readonly message: string;
  readonly details?: unknown;
}

export interface ApiSuccess<T> {
  status: responseStatus.SUCCESS;
  data: T;
  action?: unknown;
}

export interface ApiFailure {
  status: responseStatus.FAILED;
  error: ApiErrorBody;
}

export function formatResponse<T>(result: T): ApiSuccess<T> {
  const response: ApiSuccess<T> = {
    status: responseStatus.SUCCESS,
    data: result,
  };
  if (result && typeof result === 'object' && 'action' in result) {
    const { action, ...rest } = result as T & { action: unknown };
    response.action = action;
    response.data = rest as T;
  }
  return response;
}

export function formatErrorResponse(error: ApiErrorBody): ApiFailure {
  return { status: responseStatus.FAILED, error };
}

export function buildPaginationMeta(
  total: number,
  skip: number,
  take: number,
): IPaginationMeta {
  const limit = take > 0 ? take : 10;
  const page = Math.floor(skip / limit) + 1;
  return { total, page, limit, hasNextPage: skip + limit < total };
}
