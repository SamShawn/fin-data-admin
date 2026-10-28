import { DashboardOutlined, TableOutlined, SettingOutlined } from '@ant-design/icons';
import { Layout, Menu, theme, MenuProps } from 'antd';
import { Suspense } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

import { usePermission } from '../hooks/usePermission';

const { Header, Content, Sider } = Layout;

// 👇 关键修复 1：继承 Antd 的 ItemType，彻底解决类型不兼容
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

  // 👇 关键修复 2：递归过滤时，绝不返回 undefined，要么返回对象，要么就不放进数组
  const filterMenus = (menus: MenuConfig[]): MenuConfig[] => {
    const result: MenuConfig[] = [];

    for (const menu of menus) {
      // 如果有子菜单
      if (menu.children && menu.children.length > 0) {
        const filteredChildren = filterMenus(menu.children as MenuConfig[]);
        if (filteredChildren.length > 0) {
          result.push({ ...menu, children: filteredChildren });
        }
        continue;
      }

      // 如果没有权限要求，或者用户拥有该权限，则保留
      if (!menu.permission || hasPermission(menu.permission)) {
        result.push(menu);
      }
    }
    return result;
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
