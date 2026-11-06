import time
import structlog
from datetime import datetime, timedelta
from pathlib import Path

from .sources.tushare import TushareSource
from .transformers.market_data import transform_daily_quotes
from .validators.engine import ValidatorEngine
from .loaders.rejected import save_rejected
from .loaders.market_data import upsert_daily_quotes

logger = structlog.get_logger()

def run_batch_sync(start_date_str: str, end_date_str: str):
    """
    批量补数脚本
    :param start_date_str: 开始日期 (YYYY-MM-DD)
    :param end_date_str: 结束日期 (YYYY-MM-DD)
    """
    logger.info("=== 开始批量补数任务 ===", start=start_date_str, end=end_date_str)

    source = TushareSource()

    # 断点续传：获取数据库中已经存在的最后日期
    last_sync = source.get_last_sync_date()
    if last_sync:
        logger.info(f"检测到数据库已有数据，最后更新日期为 {last_sync}")
        if last_sync >= start_date_str:
            start = datetime.strptime(last_sync, "%Y-%m-%d") + timedelta(days=1)
        else:
            start = datetime.strptime(start_date_str, "%Y-%m-%d")
    else:
        start = datetime.strptime(start_date_str, "%Y-%m-%d")

    end = datetime.strptime(end_date_str, "%Y-%m-%d")

    if start > end:
        logger.info("数据已是最新，无需补数")
        return

    # 加载校验规则
    config_path = str(Path(__file__).resolve().parent.parent / "config/validation/market_data.yaml")
    validator = ValidatorEngine(config_path)

    current_date = start
    total_days = (end - start).days + 1
    processed_days = 0

    while current_date <= end:
        # 跳过周末
        if current_date.weekday() >= 5:
            current_date += timedelta(days=1)
            continue

        date_str = current_date.strftime("%Y-%m-%d")
        processed_days += 1

        logger.info(f"正在拉取 {date_str} 的数据... ({processed_days}/{total_days})")

        try:
            # 1. 拉取
            raw_df = source.fetch(date_str, date_str)
            if raw_df.empty:
                logger.info(f"{date_str} 无数据（可能是节假日）")
            else:
                # 2. 清洗
                clean_df = transform_daily_quotes(raw_df)
                # 3. 校验
                passed_df, rejected_df = validator.validate(clean_df)
                # 4. 隔离
                save_rejected("tushare_daily", rejected_df)
                # 5. 入库
                if not passed_df.empty:
                    upsert_daily_quotes(passed_df)

        except Exception as e:
            logger.error(f"拉取 {date_str} 失败，跳过继续", error=str(e))

        # 主动休眠 0.5 秒，防止触发 Tushare 频控
        time.sleep(0.5)
        current_date += timedelta(days=1)

    logger.info("=== 批量补数任务全部完成 ===")

if __name__ == "__main__":
    import sys
    if len(sys.argv) < 3:
        print("用法: python -m etl.batch_sync YYYY-MM-DD YYYY-MM-DD")
        sys.exit(1)

    run_batch_sync(sys.argv[1], sys.argv[2])
