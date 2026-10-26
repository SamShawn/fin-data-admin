import { DashboardOutlined, TableOutlined } from '@ant-design/icons';
import { Layout, Menu, theme } from 'antd';
import { Suspense } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

const { Header, Content, Sider } = Layout;

const menuItems = [
  { key: '/', icon: <DashboardOutlined />, label: '概览' },
  { key: '/market-data', icon: <TableOutlined />, label: '行情数据' },
];

export function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = theme.useToken();

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
          items={menuItems}
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
