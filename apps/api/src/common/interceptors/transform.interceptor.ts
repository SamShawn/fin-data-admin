import { ApiResponse } from '@fin/shared-types';
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    const req = context.switchToHttp().getRequest();
    return next.handle().pipe(
      map((data) => ({
        code: 0,
        message: 'success',
        data,
        requestId: req.id || '',
      })),
    );
  }
}
