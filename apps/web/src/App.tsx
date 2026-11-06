import { ConfigProvider, theme, App as AntdApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { RouterProvider } from 'react-router-dom';

import { router } from './router';

export default function App() {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1677ff',
          colorBgLayout: '#f4f7f9', // 浅灰偏蓝背景
          colorBgContainer: '#ffffff',
          borderRadius: 6,
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02)',
        },
        components: {
          Layout: {
            headerBg: '#ffffff',
            headerHeight: 56,
            headerPadding: '0 24px',
            siderBg: '#0f172a', // 深海军蓝侧边栏
          },
          Menu: {
            darkItemBg: '#0f172a',
            darkItemColor: '#94a3b8',
            darkItemHoverBg: '#1e293b',
            darkItemSelectedBg: '#1677ff',
            darkItemSelectedColor: '#ffffff',
            itemMarginInline: 8,
            itemHeight: 44,
          },
          Table: {
            headerBg: '#f8fafc',
            headerColor: '#475569',
            headerSplitColor: 'transparent',
            rowHoverBg: '#f1f5f9',
            cellPaddingBlock: 8,
            cellPaddingInline: 12,
            borderColor: '#e2e8f0',
          },
        },
      }}
    >
      {/* 使用 AntdApp 包裹，消除 message 等静态方法脱离上下文的警告 */}
      <AntdApp>
        <RouterProvider router={router} />
      </AntdApp>
    </ConfigProvider>
  );
}
