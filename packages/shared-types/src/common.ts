/**
 * 统一 API 响应格式
 */
export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
  requestId: string;
}

/**
 * 游标分页响应
 */
export interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

/**
 * 游标分页请求参数
 */
export interface PageQuery {
  cursor?: string;
  limit?: number;
}

/**
 * 统一错误码
 */
export enum ErrorCode {
  UNAUTHORIZED = 40100,
  FORBIDDEN = 40300,
  NOT_FOUND = 40400,
  VALIDATION_ERROR = 42200,
  INTERNAL_ERROR = 50000,
}
