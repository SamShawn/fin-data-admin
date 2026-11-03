import time
import pandas as pd
import tushare as ts
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
import structlog
from sqlalchemy import text

from .base import BaseSource
from ..config import settings
from ..db import engine

logger = structlog.get_logger()

class TushareSource(BaseSource):
    def __init__(self):
        if not settings.tushare_token:
            raise ValueError("缺少 TUSHARE_TOKEN 环境变量")
        ts.set_token(settings.tushare_token)
        self.pro = ts.pro_api()

    def fetch(self, start_date: str, end_date: str) -> pd.DataFrame:
        logger.info("开始拉取行情数据 (按日循环)", start_date=start_date, end_date=end_date)

        all_data = []
        # 生成日期范围（跳过周末）
        date_range = pd.date_range(start=start_date, end=end_date, freq='B')

        total_days = len(date_range)
        for idx, current_date in enumerate(date_range):
            date_str = current_date.strftime('%Y-%m-%d')
            logger.info(f"正在拉取 {date_str} 的数据... ({idx + 1}/{total_days})")

            try:
                df = self._fetch_daily_single(date_str)
            except Exception as e:
                logger.error(f"拉取 {date_str} 数据失败，跳过该日", error=str(e))
                continue

            if df.empty:
                logger.warning(f"{date_str} 无数据（可能是节假日）")
                continue

            all_data.append(df)
            logger.info(f"{date_str} 拉取完成，{len(df)} 条记录")

        if not all_data:
            logger.warning("没有拉取到任何数据")
            return pd.DataFrame()

        result = pd.concat(all_data, ignore_index=True)
        logger.info("行情数据拉取完成", total_rows=len(result))
        return result

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=2, min=2, max=30),
        retry=retry_if_exception_type(Exception),
        before_sleep=lambda retry_state: logger.warning(
            "Tushare 单日请求失败，正在重试...",
            attempt=retry_state.attempt_number,
            error=str(retry_state.outcome.exception())
        )
    )
    def _fetch_daily_single(self, trade_date: str) -> pd.DataFrame:
        """拉取单日全市场行情"""
        time.sleep(0.3)  # 主动限流
        return self.pro.daily(trade_date=trade_date.replace('-', ''))

    def get_last_sync_date(self) -> str | None:
        """查询数据库中最新的一条行情日期"""
        try:
            with engine.connect() as conn:
                result = conn.execute(text("SELECT MAX(trade_date) FROM daily_quotes"))
                last_date = result.scalar()
                if last_date:
                    return last_date.strftime('%Y-%m-%d')
                return None
        except Exception as e:
            logger.error("查询上次同步日期失败", error=str(e))
            return None

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=2, min=2, max=30),
    )
    def _fetch_daily_basic(self, trade_date: str):
        time.sleep(0.3)
        return self.pro.daily_basic(trade_date=trade_date.replace('-', ''))

    def fetch_fundamental(self, trade_date: str) -> pd.DataFrame:
        logger.info("开始拉取基本面数据", trade_date=trade_date)
        try:
            df = self._fetch_daily_basic(trade_date)
            logger.info("基本面数据拉取完成", rows=len(df))
            return df
        except Exception as e:
            logger.error("拉取基本面数据失败", error=str(e))
            return pd.DataFrame()
