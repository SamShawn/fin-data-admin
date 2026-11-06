import {
  DashboardOutlined,
  TableOutlined,
  SettingOutlined,
  LogoutOutlined,
  SearchOutlined,
  BellOutlined,
  MacCommandFilled,
} from '@ant-design/icons';
import { Layout, Menu, Dropdown, Avatar, Space, Input, Breadcrumb, message } from 'antd';
import { Suspense } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

import { apiClient } from '../api/client';
import { usePermission } from '../hooks/usePermission';
import { useAuthStore } from '../store/auth';

const { Content } = Layout;

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

  const handleLogout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // ignore
    } finally {
      logout();
      message.success('已退出');
      navigate('/login');
    }
  };

  // 极简面包屑
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
    <Layout style={{ minHeight: '100vh', background: '#08080a' }}>
      {/* 💡 悬浮胶囊侧边栏 (Margin 让出呼吸空间) */}
      <div
        style={{
          position: 'fixed',
          top: 20,
          left: 20,
          bottom: 20,
          width: 240,
          background: '#141418', // L2 卡片层材质
          borderRadius: 16,
          border: '1px solid rgba(255, 255, 255, 0.05)', // 物理高光边
          boxShadow: '0 12px 32px rgba(0,0,0,0.6)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          zIndex: 100,
        }}
      >
        {/* 品牌 Logo */}
        <div
          style={{
            height: 80,
            display: 'flex',
            alignItems: 'center',
            paddingLeft: 24,
            color: '#ededed',
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: 1,
          }}
        >
          <div
            style={{
              width: 24,
              height: 24,
              background: 'linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%)',
              borderRadius: 8,
              marginRight: 12,
              boxShadow: '0 0 16px rgba(124, 58, 237, 0.4)', // 霓虹发光
            }}
          />
          NEBULA FIN
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={filterMenus(MENU_CONFIG)}
          onClick={({ key }) => navigate(key)}
          style={{ background: 'transparent', borderRight: 'none', flex: 1, padding: '12px 16px' }}
        />
      </div>

      {/* 右侧主区域 */}
      <Layout style={{ marginLeft: 280, background: 'transparent' }}>
        {/* 💡 极简磨砂 Header */}
        <div
          style={{
            height: 80,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px 0 8px', // 左对齐与内容区保持一致
            position: 'sticky',
            top: 0,
            zIndex: 99,
            background: 'rgba(8, 8, 10, 0.6)', // 纯黑半透明
            backdropFilter: 'blur(20px)', // 毛玻璃
            WebkitBackdropFilter: 'blur(20px)',
          }}
        >
          <Breadcrumb items={getBreadcrumbItems()} style={{ fontSize: 13, color: '#71717a' }} />

          <Space size={20}>
            {/* 带有 ⌘K 快捷键提示的搜索框 */}
            <Input
              prefix={<SearchOutlined style={{ color: '#52525b' }} />}
              suffix={
                <span
                  style={{
                    color: '#52525b',
                    fontSize: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <MacCommandFilled /> K
                </span>
              }
              placeholder="Search ticker or company..."
              style={{
                width: 280,
                borderRadius: 8,
                backgroundColor: '#141418',
                border: '1px solid rgba(255,255,255,0.05)',
                color: '#ededed',
              }}
              variant="borderless"
            />
            <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)' }} />
            <BellOutlined style={{ fontSize: 18, color: '#71717a', cursor: 'pointer' }} />
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'logout',
                    icon: <LogoutOutlined />,
                    label: '退出',
                    danger: true,
                    onClick: handleLogout,
                  },
                ],
              }}
            >
              <Avatar
                size={32}
                style={{
                  background: '#141418',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#ededed',
                  cursor: 'pointer',
                }}
              >
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </Avatar>
            </Dropdown>
          </Space>
        </div>

        {/* 内容区 */}
        <Content style={{ padding: '16px 24px 24px 8px', minHeight: 'calc(100vh - 80px)' }}>
          <Suspense
            fallback={<div style={{ color: '#52525b', padding: 24 }}>Loading modules...</div>}
          >
            <Outlet />
          </Suspense>
        </Content>
      </Layout>
    </Layout>
  );
}
