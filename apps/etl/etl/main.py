import time
import schedule
from datetime import datetime, timedelta
from pathlib import Path
from dateutil.relativedelta import relativedelta
import structlog

from .sources.tushare import TushareSource
from .transformers.market_data import transform_daily_quotes
from .validators.engine import ValidatorEngine
from .loaders.rejected import save_rejected
from .loaders.market_data import upsert_stocks, upsert_daily_quotes, ensure_partitions
from .logger import setup_logging

setup_logging()
logger = structlog.get_logger()

def sync_stock_basic():
    source = TushareSource()
    df = source.fetch_stock_basic()
    if not df.empty:
        upsert_stocks(df)

def sync_daily_quotes(target_date: str | None = None):
    """核心同步逻辑：拉取 -> 清洗 -> 校验 -> 入库"""
    # 1. 拉取
    source = TushareSource()

    # 如果指定了日期（手动补数）
    if target_date:
        start_date = target_date
        end_date = target_date
        logger.info("执行手动补数", date=target_date)
    else:
        # 增量同步
        last_sync = source.get_last_sync_date()
        if not last_sync:
            # 如果库是空的，默认拉取最近 30 天
            end_date = datetime.now().strftime('%Y-%m-%d')
            start_date = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
            logger.info("数据库为空，初始化拉取 30 天数据", start=start_date, end=end_date)
        else:
            start_date = last_sync
            end_date = datetime.now().strftime('%Y-%m-%d')
            logger.info("执行增量同步", last_sync=last_sync, end=end_date)

            if start_date >= end_date:
                logger.info("数据已是最新，无需拉取")
                return

    raw_df = source.fetch(start_date, end_date)
    if raw_df.empty:
        logger.info("没有可用的新数据")
        return

    # 2. 清洗
    clean_df = transform_daily_quotes(raw_df)

    # 3. 校验
    config_path = str(Path(__file__).resolve().parent.parent / "config/validation/market_data.yaml")
    validator = ValidatorEngine(config_path)
    passed_df, rejected_df = validator.validate(clean_df)

    # 4. 隔离失败数据
    save_rejected("tushare_daily", rejected_df)

    # 5. 幂等入库
    if not passed_df.empty:
        upsert_daily_quotes(passed_df)


# ================= 定时任务相关逻辑 =================

def job_daily_quotes():
    """定时任务：每日行情同步"""
    logger.info("========== 触发定时任务: 每日行情同步 ==========")
    try:
        sync_daily_quotes()
        logger.info("========== 定时任务执行成功 ==========")
    except Exception as e:
        logger.error("========== 定时任务执行失败 ==========", error=str(e))

def job_maintain_partitions():
    """定时任务：维护数据库分区（只在每月 1 号执行）"""
    now = datetime.now()
    # 👇 增加判断：如果不是 1 号，直接跳过
    if now.day != 1:
        return

    logger.info("========== 触发定时任务: 维护数据库分区 ==========")
    try:
        start_of_next_month = (now + relativedelta(months=1)).replace(day=1)
        end_of_next_3_months = (now + relativedelta(months=3)).replace(day=1)
        ensure_partitions(start_of_next_month.date(), end_of_next_3_months.date())
        logger.info("========== 分区维护任务执行成功 ==========")
    except Exception as e:
        logger.error("========== 分区维护任务执行失败 ==========", error=str(e))

def run_scheduler():
    """启动常驻调度器"""
    logger.info("ETL 调度器启动")

    # 每天 18:00 同步行情
    schedule.every().day.at("18:00").do(job_daily_quotes)

    # 👇 每天 02:00 检查一次，但函数内部会拦截非 1 号的日子
    schedule.every().day.at("02:00").do(job_maintain_partitions)

    logger.info("已注册定时任务: 每天 18:00 同步行情，每月 1 号维护分区")

    # 启动时先检查并补齐一次分区，防止刚部署时缺失
    # 这里强制调用 ensure_partitions，绕过日期判断
    try:
        now = datetime.now()
        start_of_next_month = (now + relativedelta(months=1)).replace(day=1)
        end_of_next_3_months = (now + relativedelta(months=3)).replace(day=1)
        ensure_partitions(start_of_next_month.date(), end_of_next_3_months.date())
    except Exception as e:
        logger.error("启动时分区检查失败", error=str(e))

    while True:
        schedule.run_pending()
        time.sleep(60)


if __name__ == "__main__":
    import sys

    # 支持 python -m etl.main sync_stocks 专门拉取名称
    if len(sys.argv) > 1 and sys.argv[1] == "sync_stocks":
        logger.info("进入股票基础信息同步模式")
        sync_stock_basic()
    elif len(sys.argv) > 1:
        target = sys.argv[1]
        logger.info("进入手动补数模式", date=target)
        sync_daily_quotes(target)
    else:
        run_scheduler()
