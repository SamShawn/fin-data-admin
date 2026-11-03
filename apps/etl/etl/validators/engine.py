import yaml
import re
import pandas as pd
from pathlib import Path
import structlog

logger = structlog.get_logger()

class ValidatorEngine:
    def __init__(self, config_path: str):
        with open(config_path, 'r', encoding='utf-8') as f:
            config = yaml.safe_load(f)
        self.rules = config.get('rules', [])

    def validate(self, df: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame]:
        """返回 (通过校验的数据, 被隔离的数据)"""
        if df.empty:
            return df, pd.DataFrame()

        block_mask = pd.Series(False, index=df.index)

        for rule in self.rules:
            if rule['level'] != 'block':
                continue

            mask = self._apply_rule(df, rule)
            block_mask |= mask

        passed_df = df[~block_mask]
        rejected_df = df[block_mask]

        if not rejected_df.empty:
            logger.warning("存在校验失败数据被隔离", rejected_count=len(rejected_df))

        return passed_df, rejected_df

    def _apply_rule(self, df: pd.DataFrame, rule: dict) -> pd.Series:
        field = rule['field']
        rule_type = rule['type']

        if field not in df.columns:
            return pd.Series(False, index=df.index)

        series = df[field]

        if rule_type == 'not_null':
            return series.isna()
        elif rule_type == 'range':
            min_val = rule['params'].get('min')
            max_val = rule['params'].get('max')
            mask = pd.Series(False, index=df.index)
            if min_val is not None:
                mask |= (series < min_val)
            if max_val is not None:
                mask |= (series > max_val)
            return mask
        elif rule_type == 'regex':
            pattern = rule['params']['pattern']
            return ~series.astype(str).str.match(pattern)

        return pd.Series(False, index=df.index)
