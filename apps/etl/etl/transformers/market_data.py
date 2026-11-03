import pandas as pd
import structlog

logger = structlog.get_logger()

# 字段映射表
FIELD_MAP = {
    'ts_code': 'stock_code',
    'trade_date': 'trade_date',
    'open': 'open',
    'high': 'high',
    'low': 'low',
    'close': 'close',
    'vol': 'volume',       # Tushare: 手
    'amount': 'amount',    # Tushare: 千元
    'pct_chg': 'pct_change', # Tushare: 百分数 (如 5.23 代表 5.23%)
}

def transform_daily_quotes(df: pd.DataFrame) -> pd.DataFrame:
    if df.empty:
        return df

    logger.info("开始清洗转换行情数据", raw_rows=len(df))

    # 1. 字段重命名 (仅保留需要的列)
    df = df.rename(columns=FIELD_MAP)
    keep_cols = list(FIELD_MAP.values())
    df = df[[c for c in keep_cols if c in df.columns]]

    # 2. 单位统一
    # Tushare 成交量单位是手(100股)，转换为股
    df['volume'] = df['volume'] * 100
    # Tushare 成交额单位是千元，转换为元
    df['amount'] = df['amount'] * 1000
    # Tushare 涨跌幅是百分数(5.23)，转换为小数(0.0523)
    df['pct_change'] = df['pct_change'] / 100

    # 3. 处理缺失的 turnover_rate (Tushare daily 接口不提供)
    # 后续可以通过 daily_basic 补充，这里先置为 None
    if 'turnover_rate' not in df.columns:
        df['turnover_rate'] = None

    # 4. 日期格式统一
    df['trade_date'] = pd.to_datetime(df['trade_date'], format='%Y%m%d').dt.date

    # 5. 去重 (根据主键)
    before = len(df)
    df = df.drop_duplicates(subset=['trade_date', 'stock_code'], keep='last')
    if len(df) < before:
        logger.warning("发现重复数据并已清理", duplicates=before - len(df))

    logger.info("行情数据清洗完成", clean_rows=len(df))
    return df
