import { SetMetadata } from '@nestjs/common';

export interface AuditOptions {
  module: string; // 模块名，如 'user'
  action: string; // 操作类型，如 'UPDATE', 'CREATE', 'DELETE'
  captureBefore?: boolean; // 是否记录变更前的数据快照
  resourceIdPath?: string; // 从哪里提取资源 ID（如 'params.id'）
}

export const AUDIT_KEY = 'audit_options';

export const Auditable = (options: AuditOptions) => SetMetadata(AUDIT_KEY, options);
