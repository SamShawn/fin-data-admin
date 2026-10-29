import { CaretUpOutlined, CaretDownOutlined } from '@ant-design/icons';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  SortingState,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';

interface VirtualTableProps<T> {
  data: T[];
  columns: ColumnDef<T, unknown>[];
  fetchNextPage: () => void;
  hasMore: boolean;
  loading: boolean;
  sorting: SortingState;
  onSortingChange: (sorting: SortingState) => void;
  columnVisibility: Record<string, boolean>;
}

export function VirtualTable<T>({
  data,
  columns,
  fetchNextPage,
  hasMore,
  loading,
  sorting,
  onSortingChange,
  columnVisibility,
}: VirtualTableProps<T>) {
  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnVisibility },
    onSortingChange: (updater) => {
      const nextState = typeof updater === 'function' ? updater(sorting) : updater;
      onSortingChange(nextState);
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualSorting: true, // 声明是服务端排序，前端只展示状态
  });

  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: table.getRowModel().rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40, // 固定行高 40px
    overscan: 10, // 预渲染屏幕外 10 行，减少快速滚动白屏
  });

  // 监听滚动触底
  const onScroll = () => {
    const el = parentRef.current;
    if (!el || loading || !hasMore) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 200) {
      fetchNextPage();
    }
  };

  return (
    <div
      ref={parentRef}
      onScroll={onScroll}
      style={{ height: '70vh', overflow: 'auto', border: '1px solid #f0f0f0', borderRadius: 8 }}
    >
      {/* 表头 (固定在顶部) */}
      <div
        style={{
          display: 'flex',
          position: 'sticky',
          top: 0,
          background: '#fafafa',
          zIndex: 10,
          borderBottom: '1px solid #f0f0f0',
          fontWeight: 'bold',
        }}
      >
        {table.getHeaderGroups()[0].headers.map((header) => (
          <div
            key={header.id}
            onClick={header.column.getToggleSortingHandler()}
            style={{
              flex: 1,
              padding: '10px 16px',
              minWidth: 100,
              cursor: header.column.getCanSort() ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              userSelect: 'none',
            }}
          >
            {flexRender(header.column.columnDef.header, header.getContext())}
            {/* 排序图标 */}
            {header.column.getCanSort() && (
              <span style={{ fontSize: 10, color: '#bfbfbf' }}>
                {{
                  asc: <CaretUpOutlined style={{ color: '#1677ff' }} />,
                  desc: <CaretDownOutlined style={{ color: '#1677ff' }} />,
                }[header.column.getIsSorted() as string] ?? (
                  <span style={{ display: 'flex', flexDirection: 'column' }}>
                    <CaretUpOutlined />
                    <CaretDownOutlined style={{ marginTop: -6 }} />
                  </span>
                )}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* 虚拟滚动列表 */}
      <div style={{ height: rowVirtualizer.getTotalSize(), position: 'relative' }}>
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const row = table.getRowModel().rows[virtualRow.index];
          return (
            <div
              key={row.id}
              style={{
                display: 'flex',
                position: 'absolute',
                top: 0,
                left: 0,
                transform: `translateY(${virtualRow.start}px)`,
                height: virtualRow.size,
                width: '100%',
                borderBottom: '1px solid #f5f5f5',
                alignItems: 'center',
                background: virtualRow.index % 2 === 0 ? '#fff' : '#fafafa',
              }}
            >
              {row.getVisibleCells().map((cell) => (
                <div
                  key={cell.id}
                  style={{
                    flex: 1,
                    padding: '0 16px',
                    minWidth: 100,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* 底部加载状态 */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '16px', color: '#999' }}>加载中...</div>
      )}
      {!hasMore && data.length > 0 && (
        <div style={{ textAlign: 'center', padding: '16px', color: '#999' }}>没有更多数据了</div>
      )}
    </div>
  );
}
