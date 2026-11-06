import {
  DashboardOutlined,
  TableOutlined,
  SettingOutlined,
  LogoutOutlined,
  UserOutlined,
  SearchOutlined,
  BellOutlined,
} from '@ant-design/icons';
import { Layout, Menu, theme, Dropdown, Avatar, Space, Input, Breadcrumb, message } from 'antd';
import { Suspense } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

import { apiClient } from '../api/client';
import { usePermission } from '../hooks/usePermission';
import { useAuthStore } from '../store/auth';

const { Header, Content, Sider } = Layout;

type MenuConfig = NonNullable<React.ComponentProps<typeof Menu>['items']>[number] & {
  permission?: string;
  children?: MenuConfig[];
};

const MENU_CONFIG: MenuConfig[] = [
  { key: '/', icon: <DashboardOutlined />, label: '大盘概览' },
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

  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const filterMenus = (menus: MenuConfig[]): MenuConfig[] => {
    const result: MenuConfig[] = [];
    for (const menu of menus) {
      if (menu.children && menu.children.length > 0) {
        const filteredChildren = filterMenus(menu.children as MenuConfig[]);
        if (filteredChildren.length > 0) result.push({ ...menu, children: filteredChildren });
        continue;
      }
      if (!menu.permission || hasPermission(menu.permission)) result.push(menu);
    }
    return result;
  };

  const visibleMenus = filterMenus(MENU_CONFIG);

  const handleLogout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // ignore
    } finally {
      logout();
      message.success('已退出登录');
      navigate('/login');
    }
  };

  // 顶部右侧的用户下拉菜单
  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      danger: true,
      onClick: handleLogout,
    },
  ];

  // 把 getPageTitle 替换为动态面包屑生成逻辑
  const getBreadcrumbItems = () => {
    const pathSnippets = location.pathname.split('/').filter((i) => i);
    const items = [{ title: '首页' }];

    if (pathSnippets.length > 0) {
      if (pathSnippets[0] === 'market-data') items.push({ title: '行情数据' });
      if (pathSnippets[0] === 'admin') {
        items.push({ title: '系统管理' });
        if (pathSnippets[1] === 'users') items.push({ title: '用户管理' });
        if (pathSnippets[1] === 'roles') items.push({ title: '角色管理' });
      }
      if (pathSnippets[0] === 'audit-logs') items.push({ title: '审计日志' });
      if (pathSnippets[0] === 'strategies') items.push({ title: '策略配置' });
    }
    return items;
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* 深色侧边栏 */}
      <Sider collapsible theme="dark" width={220}>
        <div
          style={{
            height: 56,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 18,
            fontWeight: 'bold',
            letterSpacing: 1,
          }}
        >
          Fin Data
        </div>
        <Menu
          theme="dark"
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
        {/* 顶部导航栏 */}
        <Header
          style={{
            background: token.colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #e2e8f0',
          }}
        >
          {/* 左侧：面包屑 */}
          <Breadcrumb items={getBreadcrumbItems()} style={{ fontWeight: 500 }} />

          {/* 右侧：工具与用户信息 */}
          <Space size="large">
            <Input
              prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
              placeholder="搜索股票代码..."
              style={{ width: 200, borderRadius: 20, backgroundColor: '#f4f7f9' }}
              variant="borderless"
            />
            <BellOutlined style={{ fontSize: 18, color: '#64748b', cursor: 'pointer' }} />
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar
                  size="small"
                  icon={<UserOutlined />}
                  style={{ backgroundColor: '#1677ff' }}
                />
                <span style={{ color: '#334155', fontWeight: 500 }}>
                  {user?.displayName || user?.username || 'Admin'}
                </span>
              </Space>
            </Dropdown>
          </Space>
        </Header>

        {/* 内容区 */}
        <Content
          style={{
            margin: 24,
            padding: 24,
            background: token.colorBgContainer,
            borderRadius: token.borderRadius,
            boxShadow: token.boxShadow,
            minHeight: 280,
            overflow: 'auto',
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
