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
      style={{
        height: '100%', // 👈 填满父容器（父容器已经限制了高度）
        overflow: 'auto',
        border: 'none', // 👈 去除边框
        borderRadius: 0, // 👈 去除圆角，完全贴合父面板
        backgroundColor: 'transparent', // 继承深色背景
      }}
    >
      {/* 表头 */}
      <div
        style={{
          display: 'flex',
          position: 'sticky',
          top: 0,
          background: '#141418', // 与面板融为一体的颜色
          zIndex: 10,
          borderBottom: '1px solid rgba(255, 255, 255, 0.04)', // 极弱的金属线
          fontWeight: 600,
          fontSize: 11,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          color: '#71717a', // 次级文字颜色
        }}
      >
        {table.getHeaderGroups()[0].headers.map((header) => (
          <div
            key={header.id}
            onClick={header.column.getToggleSortingHandler()}
            style={{
              flex: header.column.columnDef.size ? `0 0 ${header.column.columnDef.size}px` : 1,
              padding: '12px 16px',
              minWidth: 80,
              cursor: header.column.getCanSort() ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              userSelect: 'none',
            }}
          >
            {/* 渲染表头内容，数字列右对齐 */}
            <div
              style={{
                flex: 1,
                textAlign: ['open', 'close', 'volume', 'pct_change'].includes(header.column.id)
                  ? 'right'
                  : 'left',
              }}
            >
              {flexRender(header.column.columnDef.header, header.getContext())}
            </div>

            {/* 排序图标（极简风格） */}
            {header.column.getCanSort() && (
              <span style={{ fontSize: 10, color: '#52525b' }}>
                {{
                  asc: <span style={{ color: '#7c3aed' }}>▲</span>,
                  desc: <span style={{ color: '#7c3aed' }}>▼</span>,
                }[header.column.getIsSorted() as string] ?? null}
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
                // 去掉生硬的实线，改用几乎隐形的暗色线
                borderBottom: '1px solid rgba(255, 255, 255, 0.02)',
                alignItems: 'center',
                // 放弃斑马纹，统一使用与面板融为一体的深灰色（因为表格父级已经是 #141418，这里设为透明或极深）
                background: 'transparent',
                // 添加悬浮交互：当鼠标划过时，泛起极弱的白/紫光
                transition: 'background-color 0.2s',
                cursor: 'pointer',
              }}
              // 使用 onMouseEnter/Leave 动态处理悬浮背景
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {row.getVisibleCells().map((cell) => (
                <div
                  key={cell.id}
                  style={{
                    flex: cell.column.columnDef.size ? `0 0 ${cell.column.columnDef.size}px` : 1,
                    padding: '0 16px',
                    minWidth: 80,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    // 数据列右对齐
                    textAlign: ['open', 'close', 'volume', 'pct_change'].includes(cell.column.id)
                      ? 'right'
                      : 'left',
                    // 确保文字颜色是亮灰色，不要太刺眼
                    color: '#ededed',
                    fontSize: 13,
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
