import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

import { AuditService } from '../../modules/audit/audit.service';
import { AUDIT_KEY, AuditOptions } from '../decorators/auditable.decorator';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private reflector: Reflector,
    private auditService: AuditService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const auditOptions = this.reflector.getAllAndOverride<AuditOptions>(AUDIT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!auditOptions) {
      return next.handle();
    }

    const req = context.switchToHttp().getRequest();
    const user = req.user || {};

    return next.handle().pipe(
      tap(async (result) => {
        // 提取 resourceId
        let resourceId = req.params?.id || req.body?.id;
        if (auditOptions.resourceIdPath) {
          // 简单处理 'params.id' 这种路径
          const paths = auditOptions.resourceIdPath.split('.');
          resourceId = paths.reduce((obj, key) => obj?.[key], req);
        }

        await this.auditService.log({
          userId: user.userId,
          username: user.username || 'SYSTEM',
          action: auditOptions.action,
          module: auditOptions.module,
          resourceId: resourceId ? String(resourceId) : undefined,
          requestId: req.id,
          ip: req.ip,
          userAgent: req.headers['user-agent'],
          afterSnapshot: auditOptions.captureBefore ? result : undefined, // 暂时仅记录结果
        });
      }),
    );
  }
}
