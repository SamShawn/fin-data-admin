from abc import ABC, abstractmethod
import pandas as pd
from datetime import date

class BaseSource(ABC):
    @abstractmethod
    def fetch(self, start_date: str, end_date: str) -> pd.DataFrame:
        """拉取指定日期范围的数据"""
        pass

    @abstractmethod
    def get_last_sync_date(self) -> str | None:
        """查询上次同步的截止日期（用于增量更新）"""
        pass
