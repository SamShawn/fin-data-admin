import {
  DashboardOutlined,
  TableOutlined,
  SettingOutlined,
  LogoutOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Layout, Menu, theme, MenuProps, Button, message } from 'antd';
import { Suspense } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

import { apiClient } from '../api/client';
import { usePermission } from '../hooks/usePermission';
import { useAuthStore } from '../store/auth';

const { Header, Content, Sider } = Layout;

// 继承 Antd 的 ItemType，彻底解决类型不兼容
type MenuConfig = NonNullable<MenuProps['items']>[number] & {
  permission?: string;
  children?: MenuConfig[];
};

const MENU_CONFIG: MenuConfig[] = [
  { key: '/', icon: <DashboardOutlined />, label: '概览' },
  {
    key: '/market-data',
    icon: <TableOutlined />,
    label: '行情数据',
    permission: 'sys:market_data:read',
  },
  {
    key: '/admin',
    icon: <SettingOutlined />,
    label: '系统管理',
    children: [
      { key: '/admin/users', label: '用户管理', permission: 'sys:user:read' },
      { key: '/admin/roles', label: '角色管理', permission: 'sys:role:read' },
      { key: '/audit-logs', label: '审计日志', permission: 'sys:audit:read' },
    ],
  },
];

export function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = theme.useToken();
  const { hasPermission } = usePermission();

  // 获取当前用户与登出方法
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const filterMenus = (menus: MenuConfig[]): MenuConfig[] => {
    const result: MenuConfig[] = [];

    for (const menu of menus) {
      if (menu.children && menu.children.length > 0) {
        const filteredChildren = filterMenus(menu.children as MenuConfig[]);
        if (filteredChildren.length > 0) {
          result.push({ ...menu, children: filteredChildren });
        }
        continue;
      }

      if (!menu.permission || hasPermission(menu.permission)) {
        result.push(menu);
      }
    }
    return result;
  };

  const visibleMenus = filterMenus(MENU_CONFIG);

  // 处理登出逻辑
  const handleLogout = async () => {
    try {
      // 通知后端把 Token 加入黑名单
      await apiClient.post('/auth/logout');
    } catch {
      // 👈 直接 catch 留空，不写 (e)
      // 即使后端请求失败，前端也要强制登出
    } finally {
      logout(); // 清除 Zustand 里的状态和 localStorage
      message.success('已退出登录');
      navigate('/login');
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible theme="light">
        <div
          style={{
            height: 32,
            margin: 16,
            background: 'rgba(0,0,0,0.1)',
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
          }}
        >
          Fin Data
        </div>
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={visibleMenus}
          onClick={({ key }) => {
            const findMenu = (menus: MenuConfig[], targetKey: string): MenuConfig | undefined => {
              for (const m of menus) {
                if (m.key === targetKey) return m;
                if (m.children) {
                  const found = findMenu(m.children as MenuConfig[], targetKey);
                  if (found) return found;
                }
              }
              return undefined;
            };
            const current = findMenu(MENU_CONFIG, key);
            if (current && (!current.children || current.children.length === 0)) {
              navigate(key);
            }
          }}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: '0 24px',
            background: token.colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 16,
          }}
        >
          {/* 显示当前用户 */}
          <span style={{ fontSize: 14, color: '#666' }}>
            <UserOutlined style={{ marginRight: 4 }} />
            {user?.displayName || user?.username || 'Admin'}
          </span>
          {/* 退出登录按钮 */}
          <Button type="text" danger icon={<LogoutOutlined />} onClick={handleLogout}>
            退出登录
          </Button>
        </Header>
        <Content
          style={{
            margin: 16,
            padding: 24,
            background: token.colorBgContainer,
            borderRadius: token.borderRadius,
          }}
        >
          <Suspense fallback={<div>Loading...</div>}>
            <Outlet />
          </Suspense>
        </Content>
      </Layout>
    </Layout>
  );
}
