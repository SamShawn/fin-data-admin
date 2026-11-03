from datetime import datetime, timedelta
from .sources.tushare import TushareSource
from .transformers.market_data import transform_daily_quotes
from .validators.engine import ValidatorEngine
from .loaders.rejected import save_rejected
from .logger import setup_logging
import structlog
from pathlib import Path

setup_logging()
logger = structlog.get_logger()

def sync_daily_quotes(target_date: str | None = None):
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

    # 5. 入库（下一节实现，这里先打印）
    logger.info("数据准备就绪，等待入库", passed=len(passed_df), rejected=len(rejected_df))

if __name__ == "__main__":
    import sys
    # 支持 python -m etl.main 2024-01-01 (手动补数)
    target = sys.argv[1] if len(sys.argv) > 1 else None
    sync_daily_quotes(target)
