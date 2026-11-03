from datetime import datetime, timedelta
from .sources.tushare import TushareSource
from .logger import setup_logging
import structlog

setup_logging()
logger = structlog.get_logger()

def sync_daily_quotes(target_date: str | None = None):
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

    df = source.fetch(start_date, end_date)
    if df.empty:
        logger.info("没有可用的新数据")
        return

    # 后续：transform -> validate -> load
    logger.info("数据拉取完毕，准备进入下一步", rows=len(df))

if __name__ == "__main__":
    import sys
    # 支持 python -m etl.main 2024-01-01 (手动补数)
    target = sys.argv[1] if len(sys.argv) > 1 else None
    sync_daily_quotes(target)
