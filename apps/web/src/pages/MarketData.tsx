import { DownloadOutlined, SettingOutlined } from '@ant-design/icons';
import { ColumnDef, SortingState } from '@tanstack/react-table';
import { Card, Input, Button, Space, Select, InputNumber, Dropdown, Checkbox, message } from 'antd';
import { useState, useMemo } from 'react';

import { VirtualTable } from '../components/VirtualTable';
import { useMarketData, MarketDataItem, Filters, downloadCsv } from '../hooks/useMarketData';

type DataColumn = ColumnDef<MarketDataItem, unknown> & { accessorKey: string };

export default function MarketDataPage() {
  const [form, setForm] = useState<Filters>({});
  const [sorting, setSorting] = useState<SortingState>([]);
  const [exporting, setExporting] = useState(false);

  // 动态列配置
  const allColumns: DataColumn[] = useMemo(
    () => [
      { accessorKey: 'trade_date', header: '交易日期', enableSorting: true },
      { accessorKey: 'stock_code', header: '股票代码', enableSorting: true },
      { accessorKey: 'stock_name', header: '股票名称', enableSorting: false },
      { accessorKey: 'open', header: '开盘价', enableSorting: false },
      { accessorKey: 'close', header: '收盘价', enableSorting: true },
      {
        accessorKey: 'pct_change',
        header: '涨跌幅',
        enableSorting: true,
        cell: ({ getValue }) => {
          const val = Number(getValue());
          return (
            <span style={{ color: val > 0 ? '#cf1322' : val < 0 ? '#3f8600' : '#333' }}>
              {(val * 100).toFixed(2)}%
            </span>
          );
        },
      },
      { accessorKey: 'volume', header: '成交量', enableSorting: true },
    ],
    [],
  );

  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(
    Object.fromEntries(allColumns.map((c) => [c.accessorKey, true])),
  );

  const { data, fetchNextPage, hasMore, loading, reset } = useMarketData();

  // 处理服务端排序参数
  const handleSortingChange = (newSorting: SortingState) => {
    setSorting(newSorting);
    const sortParam = newSorting.map((s) => `${s.id}:${s.desc ? 'desc' : 'asc'}`).join(',');
    reset({ ...form, sort: sortParam });
  };

  const handleSearch = () => {
    const sortParam = sorting.map((s) => `${s.id}:${s.desc ? 'desc' : 'asc'}`).join(',');
    reset({ ...form, sort: sortParam });
  };

  const handleReset = () => {
    setForm({});
    setSorting([]);
    reset({});
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await downloadCsv(form);
      message.success('导出成功');
    } catch {
      message.error('导出失败');
    } finally {
      setExporting(false);
    }
  };

  // 列配置下拉菜单
  const columnsMenu = (
    <Card size="small" style={{ minWidth: 200 }}>
      <Checkbox.Group
        value={Object.keys(columnVisibility).filter((k) => columnVisibility[k])}
        onChange={(checked) => {
          const newVis: Record<string, boolean> = {};
          allColumns.forEach((c) => {
            const key = c.accessorKey;
            newVis[key] = checked.includes(key);
          });
          setColumnVisibility(newVis);
        }}
        options={allColumns.map((c) => ({
          label: c.header as string,
          value: c.accessorKey,
        }))}
      />
    </Card>
  );

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
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

          <div style={{ flex: 1 }} />

          <Dropdown overlay={columnsMenu} trigger={['click']}>
            <Button icon={<SettingOutlined />}>列配置</Button>
          </Dropdown>

          <Button icon={<DownloadOutlined />} loading={exporting} onClick={handleExport}>
            导出 CSV
          </Button>
        </Space>
      </Card>

      {/* 虚拟滚动表格 */}
      <Card bodyStyle={{ padding: 0 }}>
        <VirtualTable
          data={data}
          columns={allColumns}
          fetchNextPage={fetchNextPage}
          hasMore={hasMore}
          loading={loading}
          sorting={sorting}
          onSortingChange={handleSortingChange}
          columnVisibility={columnVisibility}
        />
      </Card>
    </Space>
  );
}
