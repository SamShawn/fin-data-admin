-- 1. 行业 + 日期 复合索引
CREATE INDEX IF NOT EXISTS idx_stocks_industry_code
ON stocks(industry, stock_code);

-- 2. 涨跌幅排序索引
CREATE INDEX IF NOT EXISTS idx_quotes_date_pct
ON daily_quotes(trade_date, pct_change DESC NULLS LAST);

-- 3. 成交量排序索引
CREATE INDEX IF NOT EXISTS idx_quotes_date_volume
ON daily_quotes(trade_date, volume DESC NULLS LAST);

-- 4. 股票代码历史查询索引
CREATE INDEX IF NOT EXISTS idx_quotes_stock_date
ON daily_quotes(stock_code, trade_date DESC);
