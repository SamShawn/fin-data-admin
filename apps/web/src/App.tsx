import { ConfigProvider, theme, App as AntdApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { RouterProvider } from 'react-router-dom';

import { router } from './router';

export default function App() {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: theme.darkAlgorithm, // 启用暗黑基准算法
        token: {
          // 1. 深邃的空间层级 (极夜星云)
          colorBgBase: '#08080a', // L0 深空：最底层的背景
          colorBgLayout: '#0c0c0f', // L1 布局：面板间的缝隙
          colorBgContainer: '#141418', // L2 卡片：悬浮在表层的容器

          // 2. 克制的点缀色 (赛博紫 & 极光青)
          colorPrimary: '#7c3aed', // 主操作色（赛博紫）
          colorInfo: '#06b6d4', // 辅助信息色（极光青）
          colorSuccess: '#10b981', // 跌（翡翠绿）
          colorError: '#f43f5e', // 涨（霓虹红）

          // 3. 极致的排版与数字
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          fontSize: 13, // 金融终端通常字号偏小，提供极高信息密度
          colorText: '#ededed', // 主文字（极浅灰，不刺眼）
          colorTextSecondary: '#a1a1aa',
          colorTextTertiary: '#52525b',

          // 4. 物理材质 (微光边框与弥散阴影)
          colorBorder: 'rgba(255, 255, 255, 0.08)', // 极弱的金属高光边
          borderRadius: 6,
          borderRadiusLG: 12,
          boxShadow: '0 12px 32px 0 rgba(0, 0, 0, 0.6)', // 极深的弥散阴影
        },
        components: {
          Layout: {
            headerBg: 'transparent', // Header 完全透明，融入背景
            siderBg: 'transparent',
          },
          Menu: {
            darkItemBg: 'transparent',
            darkItemColor: '#a1a1aa',
            darkItemHoverBg: 'rgba(255, 255, 255, 0.04)',
            darkItemHoverColor: '#ededed',
            darkItemSelectedBg: 'rgba(124, 58, 237, 0.15)', // 极其克制的半透明紫底
            darkItemSelectedColor: '#a78bfa', // 霓虹紫文字
            itemHeight: 44,
            itemBorderRadius: 8,
          },
          Table: {
            headerBg: 'transparent',
            headerColor: '#71717a',
            headerSplitColor: 'transparent',
            rowHoverBg: 'rgba(255, 255, 255, 0.03)', // 极弱的悬浮态
            cellPaddingBlock: 12, // 高密度表格
            borderColor: 'transparent', // 取消所有强边框
          },
        },
      }}
    >
      <AntdApp>
        <RouterProvider router={router} />
      </AntdApp>
    </ConfigProvider>
  );
}
