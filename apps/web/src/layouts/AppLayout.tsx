import { DashboardOutlined, TableOutlined, SettingOutlined } from '@ant-design/icons';
import { Layout, Menu, theme } from 'antd';
import { Suspense } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

import { usePermission } from '../hooks/usePermission';

const { Header, Content, Sider } = Layout;

// 1. 定义带层级和权限的菜单项
interface MenuConfig {
  key: string;
  icon?: React.ReactNode;
  label: string;
  permission?: string;
  children?: MenuConfig[];
}

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

  // 2. 递归过滤菜单
  const filterMenus = (menus: MenuConfig[]): MenuConfig[] => {
    return menus
      .map((menu) => {
        // 如果有子菜单，递归过滤
        if (menu.children) {
          const filteredChildren = filterMenus(menu.children);
          // 如果子菜单全部被过滤掉了，父级菜单也不显示
          if (filteredChildren.length === 0) return null;
          return { ...menu, children: filteredChildren };
        }

        // 如果没有权限要求，或者用户拥有该权限，则保留
        if (!menu.permission || hasPermission(menu.permission)) {
          return menu;
        }

        // 没有权限，过滤掉
        return null;
      })
      .filter((menu): menu is MenuConfig => menu !== null);
  };

  const visibleMenus = filterMenus(MENU_CONFIG);

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
            // 只有叶子节点才跳转（有 children 的节点默认是展开/收起）
            const isLeaf = !MENU_CONFIG.find((m) => m.key === key)?.children;
            if (isLeaf) navigate(key);
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
          }}
        >
          <span>Admin</span>
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
