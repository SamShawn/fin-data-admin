-- ==========================================
-- UP (正向迁移)
-- ==========================================

-- 1. 用户表
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(64) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(64) NOT NULL,
  department VARCHAR(64),
  status SMALLINT NOT NULL DEFAULT 1, -- 1: 启用, 0: 禁用
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_users_username ON users(username);

-- 2. 角色表
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(64) NOT NULL UNIQUE,   -- admin, researcher, viewer
  name VARCHAR(64) NOT NULL,
  description VARCHAR(255),
  data_scope VARCHAR(16) NOT NULL DEFAULT 'ALL', -- ALL, DEPT, SELF
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. 权限表
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(128) NOT NULL UNIQUE,   -- sys:market_data:read
  name VARCHAR(64) NOT NULL,
  module VARCHAR(64) NOT NULL,          -- 前端菜单分组
  description VARCHAR(255)
);
CREATE INDEX idx_permissions_module ON permissions(module);

-- 4. 用户-角色关联表
CREATE TABLE user_roles (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);

-- 5. 角色-权限关联表
CREATE TABLE role_permissions (
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- 6. 审计日志表 (只增不改)
CREATE TABLE audit_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  username VARCHAR(64) NOT NULL,
  action VARCHAR(32) NOT NULL,          -- CREATE, UPDATE, DELETE, LOGIN, EXPORT
  module VARCHAR(64) NOT NULL,
  resource_id VARCHAR(64),
  request_id VARCHAR(64),
  ip VARCHAR(45),
  user_agent VARCHAR(255),
  before_snapshot JSONB,
  after_snapshot JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_user_time ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_module_time ON audit_logs(module, created_at DESC);

-- 7. 数据库触发器：禁止修改或删除审计日志
CREATE OR REPLACE FUNCTION prevent_audit_log_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit logs cannot be updated or deleted';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER no_update_audit_logs
BEFORE UPDATE ON audit_logs
FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_modification();

CREATE TRIGGER no_delete_audit_logs
BEFORE DELETE ON audit_logs
FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_modification();


-- ==========================================
-- DOWN (反向回滚)
-- ==========================================
/*
DROP TRIGGER IF EXISTS no_delete_audit_logs ON audit_logs;
DROP TRIGGER IF EXISTS no_update_audit_logs ON audit_logs;
DROP FUNCTION IF EXISTS prevent_audit_log_modification();
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS role_permissions;
DROP TABLE IF EXISTS user_roles;
DROP TABLE IF EXISTS permissions;
DROP TABLE IF EXISTS roles;
DROP TABLE IF EXISTS users;
*/
