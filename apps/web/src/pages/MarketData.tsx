import {
  DownloadOutlined,
  SettingOutlined,
  StarFilled,
  StarOutlined,
  SearchOutlined,
  LineChartOutlined,
} from '@ant-design/icons';
import { ColumnDef, SortingState } from '@tanstack/react-table';
import {
  Input,
  Button,
  Space,
  Select,
  InputNumber,
  Dropdown,
  Checkbox,
  message,
  Drawer,
  Tooltip,
  Divider,
} from 'antd';
import { useState, useMemo, useEffect, useCallback } from 'react';

import { apiClient } from '../api/client';
import { KLineChart, KLineData } from '../components/KLineChart';
import { VirtualTable } from '../components/VirtualTable';
import { useMarketData, MarketDataItem, Filters, downloadCsv } from '../hooks/useMarketData';
import { formatNumber, formatPercent, getChangeColor, formatDate } from '../utils/format';

type DataColumn = ColumnDef<MarketDataItem, unknown> & { accessorKey: string };

export default function MarketDataPage() {
  const [form, setForm] = useState<Filters>({});
  const [sorting, setSorting] = useState<SortingState>([]);
  const [exporting, setExporting] = useState(false);

  // K线抽屉
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [klineData, setKlineData] = useState<KLineData[]>([]);
  const [currentStock, setCurrentStock] = useState('');

  // 自选股
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    apiClient.get<unknown, { items: { stockCode: string }[] }>('/favorites').then((res) => {
      setFavorites(res.items.map((f) => f.stockCode));
    });
  }, []);

  const toggleFavorite = useCallback(
    async (stockCode: string) => {
      try {
        if (favorites.includes(stockCode)) {
          await apiClient.delete(`/favorites/${stockCode}`);
          setFavorites((prev) => prev.filter((c) => c !== stockCode));
        } else {
          await apiClient.post(`/favorites/${stockCode}`);
          setFavorites((prev) => [...prev, stockCode]);
        }
      } catch {
        message.error('操作失败');
      }
    },
    [favorites],
  );

  const showKline = async (stockCode: string, stockName: string) => {
    setCurrentStock(`${stockName} (${stockCode})`);
    setDrawerOpen(true);
    try {
      const res = await apiClient.get<unknown, { items: KLineData[] }>(
        `/market-data/kline?stockCode=${stockCode}`,
      );
      setKlineData(res.items);
    } catch {
      message.error('获取K线失败');
    }
  };

  // 💡 极简高密度列配置
  const allColumns: ColumnDef<MarketDataItem, unknown>[] = useMemo(
    () => [
      {
        accessorKey: 'favorite',
        header: '',
        size: 40,
        cell: ({ row }) => (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Button
              type="text"
              size="small"
              style={{ padding: 0, width: 24, height: 24 }}
              icon={
                favorites.includes(row.original.stock_code) ? (
                  <StarFilled style={{ color: '#fbbf24', fontSize: 14 }} />
                ) : (
                  <StarOutlined style={{ color: '#52525b', fontSize: 14 }} />
                )
              }
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite(row.original.stock_code);
              }}
            />
          </div>
        ),
      },
      {
        accessorKey: 'stock_code',
        header: '代码 / 名称',
        enableSorting: true,
        cell: ({ row }) => (
          <div>
            <div style={{ color: '#ededed', fontWeight: 600, fontSize: 13 }}>
              {row.original.stock_code}
            </div>
            <div style={{ color: '#71717a', fontSize: 12 }}>{row.original.stock_name}</div>
          </div>
        ),
      },
      {
        accessorKey: 'trade_date',
        header: '日期',
        enableSorting: true,
        cell: ({ getValue }) => (
          <span style={{ color: '#a1a1aa' }}>{formatDate(getValue() as string)}</span>
        ),
      },
      {
        accessorKey: 'open',
        header: '开盘',
        enableSorting: false,
        cell: ({ getValue }) => (
          <span style={{ color: '#a1a1aa' }}>{Number(getValue()).toFixed(2)}</span>
        ),
      },
      {
        accessorKey: 'close',
        header: '收盘',
        enableSorting: true,
        cell: ({ getValue }) => (
          <span style={{ color: '#ededed', fontWeight: 500 }}>{Number(getValue()).toFixed(2)}</span>
        ),
      },
      {
        accessorKey: 'pct_change',
        header: '涨跌幅',
        enableSorting: true,
        cell: ({ getValue }) => {
          const val = Number(getValue());
          return (
            <span style={{ color: getChangeColor(val), fontWeight: 600, fontSize: 13 }}>
              {formatPercent(val)}
            </span>
          );
        },
      },
      {
        accessorKey: 'volume',
        header: '成交量',
        enableSorting: true,
        cell: ({ getValue }) => (
          <span style={{ color: '#a1a1aa' }}>{formatNumber(getValue() as number)}</span>
        ),
      },
      {
        accessorKey: 'actions',
        header: '操作',
        cell: ({ row }) => (
          <Tooltip title="查看 K 线">
            <Button
              type="text"
              size="small"
              icon={<LineChartOutlined style={{ color: '#7c3aed', fontSize: 16 }} />}
              onClick={() => showKline(row.original.stock_code, row.original.stock_name)}
            />
          </Tooltip>
        ),
      },
    ],
    [favorites, toggleFavorite],
  );

  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(
    Object.fromEntries(
      allColumns.map((c) => [
        (c as { accessorKey?: string; id?: string }).accessorKey || (c as { id: string }).id,
        true,
      ]),
    ),
  );

  const { data, fetchNextPage, hasMore, loading, reset } = useMarketData();

  const handleSearch = () => {
    const sortParam = sorting.map((s) => `${s.id}:${s.desc ? 'desc' : 'asc'}`).join(',');
    reset({ ...form, sort: sortParam });
  };

  // 列配置下拉菜单
  const columnsMenu = (
    <div
      style={{
        padding: '16px',
        background: '#141418',
        borderRadius: 8,
        border: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      <Checkbox.Group
        value={Object.keys(columnVisibility).filter((k) => columnVisibility[k])}
        onChange={(checked) => {
          const newVis: Record<string, boolean> = {};
          allColumns.forEach((c) => {
            const key = (c as DataColumn).accessorKey || (c as { id: string }).id;
            newVis[key] = checked.includes(key);
          });
          setColumnVisibility(newVis);
        }}
        options={allColumns
          .filter((c) => (c as DataColumn).accessorKey)
          .map((c) => ({ label: c.header as string, value: (c as DataColumn).accessorKey }))}
      />
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
      {/* 💡 极光终端操作栏 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          background: 'rgba(20, 20, 24, 0.6)', // 极暗灰半透明
          backdropFilter: 'blur(12px)',
          borderRadius: '12px 12px 0 0', // 贴合下方表格
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <Space size={12} wrap>
          <Input
            prefix={<SearchOutlined style={{ color: '#52525b' }} />}
            placeholder="股票代码"
            value={form.stockCode}
            onChange={(e) => setForm({ ...form, stockCode: e.target.value })}
            style={{
              width: 160,
              borderRadius: 6,
              backgroundColor: '#08080a',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
            variant="borderless"
          />
          <Select
            placeholder="行业板块"
            allowClear
            style={{ width: 140 }}
            onChange={(val) => setForm({ ...form, industry: val })}
            options={['银行', '电子', '医药', '计算机'].map((v) => ({ label: v, value: v }))}
            variant="borderless"
            dropdownStyle={{ background: '#141418', borderRadius: 8 }}
          />
          <InputNumber
            placeholder="涨跌幅 >"
            value={form.minPctChange}
            onChange={(val) => setForm({ ...form, minPctChange: val as number })}
            style={{
              width: 110,
              backgroundColor: '#08080a',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          />
          <InputNumber
            placeholder="涨跌幅 <"
            value={form.maxPctChange}
            onChange={(val) => setForm({ ...form, maxPctChange: val as number })}
            style={{
              width: 110,
              backgroundColor: '#08080a',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          />
          <Button
            type="primary"
            onClick={handleSearch}
            style={{ boxShadow: '0 4px 14px rgba(124, 58, 237, 0.3)' }}
          >
            查询
          </Button>
          <Button
            onClick={() => {
              setForm({});
              reset({});
            }}
          >
            重置
          </Button>
        </Space>

        <Space>
          <Dropdown overlay={columnsMenu} trigger={['click']}>
            <Button type="text" icon={<SettingOutlined />} style={{ color: '#a1a1aa' }} />
          </Dropdown>
          <Divider type="vertical" style={{ borderColor: 'rgba(255,255,255,0.1)' }} />
          <Button
            type="text"
            icon={<DownloadOutlined />}
            loading={exporting}
            onClick={async () => {
              setExporting(true);
              try {
                await downloadCsv(form);
                message.success('导出成功');
              } finally {
                setExporting(false);
              }
            }}
            style={{ color: '#a1a1aa' }}
          >
            导出 CSV
          </Button>
        </Space>
      </div>

      {/* 💡 极简数据流表格 */}
      <div
        style={{
          flex: 1,
          background: '#141418',
          borderRadius: '0 0 12px 12px',
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.05)',
          borderTop: 'none',
        }}
      >
        <VirtualTable
          data={data}
          columns={allColumns}
          fetchNextPage={fetchNextPage}
          hasMore={hasMore}
          loading={loading}
          sorting={sorting}
          onSortingChange={setSorting}
          columnVisibility={columnVisibility}
        />
      </div>

      {/* K 线抽屉：毛玻璃背景 */}
      <Drawer
        title={<span style={{ color: '#ededed', fontWeight: 600 }}>{currentStock} 历史走势</span>}
        width={900}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        destroyOnClose
        styles={{
          body: { padding: 0, background: '#08080a' },
          header: { background: '#141418', borderBottom: '1px solid rgba(255,255,255,0.05)' },
        }}
        style={{ background: '#141418' }}
      >
        <KLineChart data={klineData} stockName={currentStock} />
      </Drawer>
    </div>
  );
}
