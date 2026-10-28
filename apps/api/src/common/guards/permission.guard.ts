import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { PERMISSIONS_KEY } from '../decorators/require-permission.decorator';
import { matchPermission } from '../utils/permission.util';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // 如果没有配置权限要求，默认放行
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.permissions) {
      throw new ForbiddenException('无权限访问');
    }

    // 只要满足其中任意一个权限即可放行
    const hasPermission = requiredPermissions.some((req) =>
      user.permissions.some((owned: string) => matchPermission(req, owned)),
    );

    if (!hasPermission) {
      throw new ForbiddenException('无权限执行此操作');
    }

    return true;
  }
}
