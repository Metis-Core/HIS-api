export enum responseStatus {
    SUCCESS = 'success',
    FAILED = 'failed',
  }
  
  export function formatResponse(result: any) {
    const response: any = {};
    response['status'] = responseStatus.SUCCESS;
    if (result.action) {
      response['action'] = result.action;
      delete result['action'];
    }
    response['data'] = result;
    return response;
  }
  
  export function formatErrorResponse(error: any) {
    return {
      status: responseStatus.FAILED,
      error,
    };
  }
  
  export type IPagination<T> = {
    readonly items: T[];
    readonly total: number;
  };