-- ==========================================
-- UP (正向迁移)
-- ==========================================

-- 1. 股票基础信息表
CREATE TABLE stocks (
  stock_code VARCHAR(16) PRIMARY KEY,     -- 000001.SZ
  stock_name VARCHAR(64) NOT NULL,
  exchange VARCHAR(8) NOT NULL,           -- SZ / SH / BJ
  industry VARCHAR(64),
  list_date DATE,
  status SMALLINT NOT NULL DEFAULT 1,     -- 1 上市 0 退市
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_stocks_industry ON stocks(industry);

-- 2. 行情数据表（按日期范围分区，按月）
CREATE TABLE daily_quotes (
  trade_date DATE NOT NULL,
  stock_code VARCHAR(16) NOT NULL,
  open NUMERIC(12,4),
  high NUMERIC(12,4),
  low NUMERIC(12,4),
  close NUMERIC(12,4),
  volume BIGINT,
  amount NUMERIC(20,4),
  pct_change NUMERIC(8,4),
  turnover_rate NUMERIC(8,4),
  PRIMARY KEY (trade_date, stock_code)
) PARTITION BY RANGE (trade_date);

-- 创建 2023-2024 年的分区（按月）
DO $$
DECLARE
    start_date DATE := '2023-01-01';
    end_date DATE := '2025-01-01';
BEGIN
    WHILE start_date < end_date LOOP
        EXECUTE format(
            'CREATE TABLE daily_quotes_%s PARTITION OF daily_quotes FOR VALUES FROM (%L) TO (%L)',
            to_char(start_date, 'YYYY_MM'),
            start_date,
            start_date + INTERVAL '1 month'
        );
        start_date := start_date + INTERVAL '1 month';
    END LOOP;
END $$;

-- 创建复合索引 (与游标分页的排序键严格一致)
CREATE INDEX idx_quotes_date_code ON daily_quotes(trade_date DESC, stock_code ASC);

-- 3. 财务指标表（基本面数据）
CREATE TABLE financial_indicators (
  stock_code VARCHAR(16) NOT NULL,
  report_date DATE NOT NULL,              -- 报告期
  pe NUMERIC(12,4),
  pb NUMERIC(12,4),
  roe NUMERIC(8,4),
  revenue NUMERIC(20,4),
  net_profit NUMERIC(20,4),
  debt_ratio NUMERIC(8,4),
  PRIMARY KEY (stock_code, report_date)
);
CREATE INDEX idx_financial_report_date ON financial_indicators(report_date);

-- ==========================================
-- DOWN (反向回滚)
-- ==========================================
/*
DROP TABLE IF EXISTS financial_indicators;
DROP TABLE IF EXISTS daily_quotes CASCADE;
DROP TABLE IF EXISTS stocks;
*/
