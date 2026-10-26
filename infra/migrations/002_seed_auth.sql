-- 1. 插入基础权限 (按模块划分)
INSERT INTO permissions (code, name, module) VALUES
('sys:user:read', '查看用户', 'user'),
('sys:user:write', '编辑用户', 'user'),
('sys:user:delete', '删除用户', 'user'),
('sys:role:read', '查看角色', 'role'),
('sys:role:write', '编辑角色', 'role'),
('sys:audit:read', '查看审计', 'audit'),
('sys:market_data:read', '查看行情', 'market_data'),
('sys:market_data:export', '导出行情', 'market_data');

-- 2. 插入角色
INSERT INTO roles (code, name, data_scope) VALUES
('admin', '系统管理员', 'ALL'),
('researcher', '投研人员', 'DEPT'),
('viewer', '普通访客', 'SELF');

-- 3. 给 admin 角色分配所有权限
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p WHERE r.code = 'admin';

-- 4. 插入默认管理员账号 (密码替换为真实的 hash)
-- 假设密码是 admin123
INSERT INTO users (username, password_hash, display_name, department)
VALUES ('admin', '$2b$10$eXgB3Uom/UXcpIiGfffDCuBWnerw2gaHPh9LQfLk9Dj0WQsb.wqJu', '超级管理员', 'IT部');

-- 5. 给 admin 账号绑定 admin 角色
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r WHERE u.username = 'admin' AND r.code = 'admin';
