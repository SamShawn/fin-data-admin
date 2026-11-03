import json
from sqlalchemy import text
from ..db import engine
import structlog

logger = structlog.get_logger()

def save_rejected(source: str, rejected_df):
    if rejected_df.empty:
        return

    logger.info("开始写入隔离表", rows=len(rejected_df))

    with engine.begin() as conn:
        for _, row in rejected_df.iterrows():
            payload = row.to_dict()
            # 处理 date 类型无法序列化为 JSON 的问题
            for k, v in payload.items():
                if hasattr(v, 'isoformat'):
                    payload[k] = v.isoformat()

            conn.execute(
                text("""
                    INSERT INTO raw.staging_rejected (source, reason, payload)
                    VALUES (:source, :reason, :payload)
                """),
                {
                    "source": source,
                    "reason": "校验规则拦截",
                    "payload": json.dumps(payload, ensure_ascii=False)
                }
            )
    logger.info("隔离数据写入完成")
