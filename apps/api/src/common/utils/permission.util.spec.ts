import { describe, it, expect } from 'vitest';
import { matchPermission } from './permission.util';

describe('Permission Matching Logic', () => {
  it('应精确匹配完全相同的权限码', () => {
    expect(matchPermission('sys:market_data:read', 'sys:market_data:read')).toBe(true);
    expect(matchPermission('sys:market_data:read', 'sys:market_data:write')).toBe(false);
  });

  it('应支持单段通配符 *', () => {
    expect(matchPermission('sys:market_data:read', 'sys:market_data:*')).toBe(true);
    expect(matchPermission('sys:market_data:export', 'sys:market_data:*')).toBe(true);
    expect(matchPermission('sys:user:read', 'sys:market_data:*')).toBe(false);
  });

  it('应支持多级 scope 通配符 .*', () => {
    expect(matchPermission('sys:market_data:read', 'sys.*:*:*')).toBe(true);
    expect(matchPermission('sys:auth:user:read', 'sys.*:*:*')).toBe(true);
  });
});
