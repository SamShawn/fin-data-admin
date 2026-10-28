import { useCallback } from 'react';

import { useAuthStore } from '../store/auth';

// 复用后端的通配符匹配逻辑
function matchPermission(required: string, owned: string): boolean {
  if (required === owned) return true;
  const reqParts = required.split(':');
  const ownParts = owned.split(':');
  if (ownParts[ownParts.length - 1] === '*' && ownParts[ownParts.length - 2] === '.*') return true;

  for (let i = 0; i < Math.max(reqParts.length, ownParts.length); i++) {
    const r = reqParts[i];
    const o = ownParts[i];
    if (o === undefined) return false;
    if (r === undefined) return true;
    if (o === '*') continue;
    if (o === '.*') return true;
    if (r !== o) return false;
  }
  return true;
}

export function usePermission() {
  const permissions = useAuthStore((state) => state.user?.permissions || []);

  const hasPermission = useCallback(
    (required: string | string[]) => {
      const reqs = Array.isArray(required) ? required : [required];
      return reqs.some((req) => permissions.some((owned) => matchPermission(req, owned)));
    },
    [permissions],
  );

  return { hasPermission };
}
