import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { Row, Col, Table, Tag } from 'antd';
import ReactECharts from 'echarts-for-react';
import { useEffect, useState } from 'react';

import { apiClient } from '../api/client';
import { formatPercent, getChangeColor } from '../utils/format';

// 💡 严格定义接口类型
interface IndexData {
  name: string;
  code: string;
  value: number;
  change: number;
  data: number[];
}

interface FavoriteItem {
  stockCode: string;
  close?: number;
  pctChange?: number;
}

// 模拟大盘指数走势的迷你图配置
const getSparklineOption = (color: string, data: number[]) => ({
  grid: { top: 5, bottom: 5, left: 5, right: 5 },
  xAxis: { type: 'category', show: false },
  yAxis: { type: 'value', show: false, min: 'dataMin', max: 'dataMax' },
  series: [
    {
      type: 'line',
      data: data,
      smooth: true,
      showSymbol: false,
      lineStyle: { width: 2, color },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: `${color}40` },
            { offset: 1, color: `${color}00` },
          ],
        },
      },
    },
  ],
});

export default function HomePage() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);

  // 获取用户的自选股
  useEffect(() => {
    // 💡 泛型明确指定返回结构
    apiClient.get<unknown, { items: { stockCode: string }[] }>('/favorites').then((res) => {
      // 这里做一层 Mock，假装有实时价格，为了视觉好看（后续对接 WebSocket）
      const mockDataWithPrices = res.items.map((f) => ({
        stockCode: f.stockCode,
        close: Math.random() * 50 + 10, // 随机价格
        pctChange: (Math.random() - 0.5) * 0.1, // 随机涨跌幅
      }));
      setFavorites(mockDataWithPrices);
    });
  }, []);

  // 指数 Mock 数据（后续可由 ETL 接口真实提供）
  const indices: IndexData[] = [
    {
      name: '上证指数',
      code: '000001.SH',
      value: 3050.23,
      change: 1.25,
      data: [3000, 3020, 3010, 3040, 3030, 3050],
    },
    {
      name: '深证成指',
      code: '399001.SZ',
      value: 9800.12,
      change: -0.85,
      data: [9900, 9850, 9880, 9820, 9830, 9800],
    },
    {
      name: '创业板指',
      code: '399006.SZ',
      value: 1920.45,
      change: 2.1,
      data: [1880, 1890, 1900, 1895, 1910, 1920],
    },
  ];

  const favColumns = [
    {
      title: '代码',
      dataIndex: 'stockCode',
      key: 'stockCode',
      render: (text: string) => <span style={{ fontWeight: 600, color: '#ededed' }}>{text}</span>,
    },
    {
      title: '最新价',
      dataIndex: 'close',
      key: 'close',
      align: 'right' as const,
      render: (val: number) => <span style={{ fontWeight: 600 }}>{val?.toFixed(2) || '-'}</span>,
    },
    {
      title: '涨跌幅',
      dataIndex: 'pctChange',
      key: 'pctChange',
      align: 'right' as const,
      render: (val: number) =>
        val !== undefined ? (
          <span style={{ color: getChangeColor(val), fontWeight: 600 }}>{formatPercent(val)}</span>
        ) : (
          '-'
        ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* 💡 大盘指数概览卡片 */}
      <Row gutter={24}>
        {indices.map((idx) => {
          const isUp = idx.change > 0;
          const color = isUp ? '#f43f5e' : '#10b981';
          return (
            <Col span={8} key={idx.code}>
              <div
                style={{
                  background: '#141418',
                  borderRadius: 12,
                  padding: '20px 24px',
                  border: '1px solid rgba(255,255,255,0.05)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div style={{ color: '#a1a1aa', fontSize: 14, marginBottom: 8 }}>{idx.name}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                  <span style={{ color, fontSize: 28, fontWeight: 700, fontFamily: 'monospace' }}>
                    {idx.value.toFixed(2)}
                  </span>
                  <span style={{ color, fontSize: 14, fontWeight: 500 }}>
                    {isUp ? <ArrowUpOutlined /> : <ArrowDownOutlined />} {idx.change.toFixed(2)}%
                  </span>
                </div>
                {/* 迷你走势图背景 */}
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    bottom: 0,
                    width: '50%',
                    height: '60%',
                    opacity: 0.6,
                  }}
                >
                  <ReactECharts
                    option={getSparklineOption(color, idx.data)}
                    style={{ height: '100%', width: '100%' }}
                  />
                </div>
              </div>
            </Col>
          );
        })}
      </Row>

      {/* 💡 自选股看板 */}
      <div
        style={{
          background: '#141418',
          borderRadius: 12,
          padding: '24px',
          border: '1px solid rgba(255,255,255,0.05)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
          }}
        >
          <h2 style={{ color: '#ededed', fontSize: 18, margin: 0, fontWeight: 600 }}>我的自选</h2>
          <Tag
            color="purple"
            style={{ background: 'rgba(124,58,237,0.15)', border: 'none', color: '#a78bfa' }}
          >
            实时监控
          </Tag>
        </div>

        <Table
          columns={favColumns}
          dataSource={favorites}
          rowKey="stockCode"
          pagination={false}
          locale={{
            emptyText: <span style={{ color: '#52525b' }}>暂无自选股，去“行情数据”添加吧</span>,
          }}
          style={{ background: 'transparent' }}
        />
      </div>
    </div>
  );
}
