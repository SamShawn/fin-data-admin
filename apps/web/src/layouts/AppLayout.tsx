import { DashboardOutlined, TableOutlined, UserOutlined } from '@ant-design/icons';
import { Layout, Menu, theme } from 'antd';
import { Suspense } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

import { usePermission } from '../hooks/usePermission';

const { Header, Content, Sider } = Layout;

export function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = theme.useToken();
  const { hasPermission } = usePermission();

  // 动态菜单配置
  const menuItems = [
    { key: '/', icon: <DashboardOutlined />, label: '概览' },
    {
      key: '/market-data',
      icon: <TableOutlined />,
      label: '行情数据',
      permission: 'sys:market_data:read', // 配置需要的权限
    },
    {
      key: '/admin/users',
      icon: <UserOutlined />,
      label: '用户管理',
      permission: 'sys:user:read',
    },
  ];

  // 过滤掉没有权限的菜单
  const visibleMenus = menuItems.filter(
    (item) => !item.permission || hasPermission(item.permission),
  );

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
          onClick={({ key }) => navigate(key)}
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
