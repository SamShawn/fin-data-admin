import { ErrorCode, ApiResponse } from '@fin/shared-types';
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';

const HTTP_TO_BIZ_CODE: Record<number, ErrorCode> = {
  [HttpStatus.UNAUTHORIZED]: ErrorCode.UNAUTHORIZED,
  [HttpStatus.FORBIDDEN]: ErrorCode.FORBIDDEN,
  [HttpStatus.NOT_FOUND]: ErrorCode.NOT_FOUND,
  [HttpStatus.UNPROCESSABLE_ENTITY]: ErrorCode.VALIDATION_ERROR,
};

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { id?: string }>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = ErrorCode.INTERNAL_ERROR;

    let message: string = '服务器内部错误';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      code = HTTP_TO_BIZ_CODE[status] || ErrorCode.INTERNAL_ERROR;

      const resContent = exception.getResponse();

      if (typeof resContent === 'string') {
        message = resContent;
      } else if (resContent && typeof resContent === 'object' && 'message' in resContent) {
        const rawMessage = (resContent as { message: string | string[] }).message;
        message = Array.isArray(rawMessage) ? rawMessage.join(', ') : rawMessage;
      }
    } else {
      this.logger.error(
        `[${request.method}] ${request.url} - 未知异常`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    const errorResponse: ApiResponse<null> = {
      code,
      message,
      data: null,
      requestId: request.id || '',
    };

    response.status(status).json(errorResponse);
  }
}
