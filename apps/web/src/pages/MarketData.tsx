import { ColumnDef } from '@tanstack/react-table';
import { Card, Input, Button, Space, Select, InputNumber } from 'antd';
import { useState } from 'react';

import { VirtualTable } from '../components/VirtualTable';
import { useMarketData, MarketDataItem, Filters } from '../hooks/useMarketData';

const columns: ColumnDef<MarketDataItem, unknown>[] = [
  { accessorKey: 'trade_date', header: '交易日期' },
  { accessorKey: 'stock_code', header: '股票代码' },
  { accessorKey: 'stock_name', header: '股票名称' },
  { accessorKey: 'open', header: '开盘价' },
  { accessorKey: 'close', header: '收盘价' },
  {
    accessorKey: 'pct_change',
    header: '涨跌幅',
    cell: ({ getValue }) => {
      const val = Number(getValue());
      return (
        <span style={{ color: val > 0 ? '#cf1322' : val < 0 ? '#3f8600' : '#333' }}>
          {(val * 100).toFixed(2)}%
        </span>
      );
    },
  },
  { accessorKey: 'volume', header: '成交量' },
];

export default function MarketDataPage() {
  const { data, fetchNextPage, hasMore, loading, reset } = useMarketData();

  // 筛选状态
  const [form, setForm] = useState<Filters>({});

  const handleSearch = () => {
    reset(form);
  };

  const handleReset = () => {
    const empty = {};
    setForm(empty);
    reset(empty);
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      {/* 筛选面板 */}
      <Card size="small">
        <Space wrap>
          <Input
            placeholder="股票代码"
            value={form.stockCode}
            onChange={(e) => setForm({ ...form, stockCode: e.target.value })}
            style={{ width: 150 }}
          />
          <Select
            placeholder="行业"
            allowClear
            style={{ width: 150 }}
            onChange={(val) => setForm({ ...form, industry: val })}
            options={['银行', '电子', '医药', '汽车', '计算机'].map((v) => ({
              label: v,
              value: v,
            }))}
          />
          <InputNumber
            placeholder="涨跌幅(>)"
            value={form.minPctChange}
            onChange={(val) => setForm({ ...form, minPctChange: val as number })}
            style={{ width: 120 }}
            step={0.01}
          />
          <InputNumber
            placeholder="涨跌幅(<)"
            value={form.maxPctChange}
            onChange={(val) => setForm({ ...form, maxPctChange: val as number })}
            style={{ width: 120 }}
            step={0.01}
          />
          <Button type="primary" onClick={handleSearch}>
            查询
          </Button>
          <Button onClick={handleReset}>重置</Button>
        </Space>
      </Card>

      {/* 虚拟滚动表格 */}
      <Card bodyStyle={{ padding: 0 }}>
        <VirtualTable
          data={data}
          columns={columns}
          fetchNextPage={fetchNextPage}
          hasMore={hasMore}
          loading={loading}
        />
      </Card>
    </Space>
  );
}
