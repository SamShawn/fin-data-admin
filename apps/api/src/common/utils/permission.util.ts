/**
 * 匹配权限码
 * @param required 需要的权限码 (如 sys:market_data:read)
 * @param owned 用户拥有的权限码 (如 sys:*:*)
 */
export function matchPermission(required: string, owned: string): boolean {
  if (required === owned) return true;

  // 处理类似于 sys.*:*:* 这种带有 .* 的通配符
  if (owned.includes('.*')) {
    const prefix = owned.substring(0, owned.indexOf('.*'));
    return required.startsWith(prefix);
  }

  // 处理普通通配符 sys:*:*
  const reqParts = required.split(':');
  const ownParts = owned.split(':');

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
