import { renderHook } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';

import { useAuthStore } from '../store/auth';

import { usePermission } from './usePermission';

describe('usePermission Hook', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: {
        id: '1',
        username: 'admin',
        displayName: 'Admin',
        status: 1,
        roles: [],
        permissions: ['sys:market_data:read', 'sys:user:*'],
      },
    });
  });

  it('应返回 true 匹配拥有的直接权限', () => {
    const { result } = renderHook(() => usePermission());
    expect(result.current.hasPermission('sys:market_data:read')).toBe(true);
  });

  it('应返回 true 匹配拥有的通配符权限', () => {
    const { result } = renderHook(() => usePermission());
    expect(result.current.hasPermission('sys:user:write')).toBe(true);
  });

  it('应返回 false 匹配未拥有的权限', () => {
    const { result } = renderHook(() => usePermission());
    expect(result.current.hasPermission('sys:audit:read')).toBe(false);
  });
});
