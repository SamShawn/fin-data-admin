import { useState, useCallback, useEffect, useMemo } from 'react';

import { apiClient } from '../api/client';

export interface MarketDataItem {
  trade_date: string;
  stock_code: string;
  stock_name: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  amount: number;
  pct_change: number;
}

export interface CursorPage {
  items: MarketDataItem[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface Filters {
  stockCode?: string;
  startDate?: string;
  endDate?: string;
  industry?: string;
  minPctChange?: number;
  maxPctChange?: number;
  sort?: string;
}

export function useMarketData(initialFilters: Filters = {}) {
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [pages, setPages] = useState<CursorPage[]>([]);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  // 重置并重新拉取第一页
  const reset = useCallback((newFilters: Filters) => {
    setFilters(newFilters);
    setPages([]);
    setCursor(undefined);
    setHasMore(true);
  }, []);

  const fetchNextPage = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const params = { ...filters, cursor, limit: 200 };
      // 移除空字段
      Object.keys(params).forEach((k) => {
        if (
          params[k as keyof typeof params] === undefined ||
          params[k as keyof typeof params] === ''
        ) {
          delete params[k as keyof typeof params];
        }
      });

      const res = await apiClient.get<unknown, CursorPage>('/market-data', { params });
      setPages((prev) => [...prev, res]);
      setCursor(res.nextCursor || undefined);
      setHasMore(res.hasMore);
    } finally {
      setLoading(false);
    }
  }, [cursor, hasMore, loading, filters]);

  // 当 filters 改变时，重置并拉取第一页
  useEffect(() => {
    setPages([]);
    setCursor(undefined);
    setHasMore(true);
    // 注意：这里为了简化，直接触发一次请求
    setLoading(true);
    apiClient
      .get<unknown, CursorPage>('/market-data', { params: { ...filters, limit: 200 } })
      .then((res) => {
        setPages([res]);
        setCursor(res.nextCursor || undefined);
        setHasMore(res.hasMore);
      })
      .finally(() => setLoading(false));
  }, [filters]);

  // 扁平化数据
  const data = useMemo(() => pages.flatMap((p) => p.items), [pages]);

  return {
    data,
    fetchNextPage,
    hasMore,
    loading,
    reset,
    filters,
  };
}
