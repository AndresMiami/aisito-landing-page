// filepath: api-service/src/types/common.js
export interface APIResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface Error {
  code: string;
  message: string;
  details?: any;
}