import pandas as pd
from sqlalchemy import text
from datetime import date
from dateutil.relativedelta import relativedelta
from ..db import engine
import structlog

logger = structlog.get_logger()

def ensure_partitions(start_date: date, end_date: date):
    """确保指定日期范围内的 daily_quotes 表分区存在。"""
    logger.info("检查并自动创建缺失的数据库分区", start_date=str(start_date), end_date=str(end_date))

    current = start_date.replace(day=1)
    end_month = end_date.replace(day=1)

    try:
        # 使用 engine.begin() 确保自动提交事务，防止死锁
        with engine.begin() as conn:
            while current <= end_month:
                partition_name = f"daily_quotes_{current.strftime('%Y_%m')}"
                next_month = current + relativedelta(months=1)

                check_sql = text("SELECT 1 FROM pg_class WHERE relname = :table_name")
                exists = conn.execute(check_sql, {"table_name": partition_name}).scalar()

                if not exists:
                    create_sql = text(f"""
                        CREATE TABLE IF NOT EXISTS {partition_name} PARTITION OF daily_quotes
                        FOR VALUES FROM ('{current.isoformat()}') TO ('{next_month.isoformat()}');
                    """)
                    conn.execute(create_sql)
                    logger.info("已自动创建分区", partition=partition_name)

                current = next_month

        logger.info("分区检查完成")
    except Exception as e:
        logger.error("自动创建分区失败", error=str(e))
        raise e

def upsert_daily_quotes(df: pd.DataFrame):
    if df.empty:
        return

    # 1. 自动维护分区
    min_date = df['trade_date'].min()
    max_date = df['trade_date'].max()
    ensure_partitions(min_date, max_date)

    # 2. 原有入库逻辑
    logger.info("开始幂等写入行情数据", rows=len(df))

    # 将 DataFrame 转换为字典列表
    records = df.to_dict('records')
    batch_size = 1000
    total_inserted = 0

    with engine.begin() as conn:
        for i in range(0, len(records), batch_size):
            batch = records[i:i + batch_size]

            # 构建 VALUES 子句 (处理 None 值)
            values_sql = []
            params = {}

            for idx, row in enumerate(batch):
                prefix = f"r{idx}_"
                values_sql.append(f"(:{prefix}trade_date, :{prefix}stock_code, :{prefix}open, :{prefix}high, :{prefix}low, :{prefix}close, :{prefix}volume, :{prefix}amount, :{prefix}pct_change, :{prefix}turnover_rate)")

                # 遍历字段并补充参数
                for k, v in row.items():
                    params[f"{prefix}{k}"] = v

            # 执行幂等写入 SQL
            sql = text(f"""
                INSERT INTO daily_quotes (
                    trade_date, stock_code, open, high, low, close,
                    volume, amount, pct_change, turnover_rate
                ) VALUES {','.join(values_sql)}
                ON CONFLICT (trade_date, stock_code) DO UPDATE SET
                    open = EXCLUDED.open,
                    high = EXCLUDED.high,
                    low = EXCLUDED.low,
                    close = EXCLUDED.close,
                    volume = EXCLUDED.volume,
                    amount = EXCLUDED.amount,
                    pct_change = EXCLUDED.pct_change,
                    turnover_rate = EXCLUDED.turnover_rate
            """)

            conn.execute(sql, params)
            total_inserted += len(batch)
            logger.info(f"已入库 {total_inserted} / {len(records)} 条...")

    logger.info("行情数据入库完成", total=total_inserted)

def upsert_stocks(df: pd.DataFrame):
    if df.empty:
        return
    logger.info("开始更新 stocks 基础信息", rows=len(df))

    with engine.begin() as conn:
        for _, row in df.iterrows():
            # 使用 ON CONFLICT 更新名称与行业
            conn.execute(
                text("""
                    INSERT INTO stocks (stock_code, stock_name, exchange, industry, list_date, status)
                    VALUES (:code, :name, :exchange, :industry, :list_date, 1)
                    ON CONFLICT (stock_code) DO UPDATE SET
                        stock_name = EXCLUDED.stock_name,
                        industry = EXCLUDED.industry
                """),
                {
                    "code": row['ts_code'],
                    "name": row['name'],
                    # 解析交易所后缀
                    "exchange": row['ts_code'].split('.')[1],
                    "industry": row['industry'],
                    "list_date": row['list_date']
                }
            )
    logger.info("股票基础信息入库完成")
