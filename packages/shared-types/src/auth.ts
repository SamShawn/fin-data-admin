/**
 * 权限实体
 */
export interface Permission {
  id: string;
  code: string; // URN 格式: sys:market_data:read
  name: string;
  module: string; // 用于前端菜单分组
  description?: string;
}

/**
 * 角色实体
 */
export interface Role {
  id: string;
  code: string; // admin, researcher, viewer
  name: string;
  description?: string;
  permissions?: Permission[];
}

/**
 * 用户实体（前端视角，不含敏感字段）
 */
export interface User {
  id: string;
  username: string;
  displayName: string;
  department?: string;
  status: number;
  roles: Role[];
  permissions: string[]; // 扁平化的权限码列表，方便前端直接判断
}

/**
 * 登录请求
 */
export interface LoginRequest {
  username: string;
  password: string;
}

/**
 * 登录/刷新响应
 */
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}
