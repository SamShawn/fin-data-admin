/**
 * 匹配权限码
 * @param required 需要的权限码 (如 sys:market_data:read)
 * @param owned 用户拥有的权限码 (如 sys:*:*)
 */
export function matchPermission(required: string, owned: string): boolean {
  if (required === owned) return true;

  const reqParts = required.split(':');
  const ownParts = owned.split(':');

  // 如果拥有的权限后缀是 .*，代表全匹配
  if (owned.endsWith('.*')) {
    // 验证前缀是否匹配
    const prefix = owned.replace('.*', '');
    return required.startsWith(prefix);
  }

  for (let i = 0; i < Math.max(reqParts.length, ownParts.length); i++) {
    const r = reqParts[i];
    const o = ownParts[i];

    if (o === undefined) return false;
    if (r === undefined) return true;
    if (o === '*') continue;
    if (r !== o) return false;
  }
  return true;
}
