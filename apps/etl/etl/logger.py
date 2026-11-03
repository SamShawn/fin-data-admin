import logging
import structlog
from .config import settings

def setup_logging():
    logging.basicConfig(
        format="%(message)s",
        level=getattr(logging, settings.log_level.upper(), logging.INFO),
    )

    # 👇 根据环境决定是否转义中文
    is_dev = settings.node_env == "development"

    structlog.configure(
        processors=[
            structlog.stdlib.add_log_level,
            structlog.processors.TimeStamper(fmt="iso"),
            # 开发环境 ensure_ascii=False（显示中文），生产环境默认转义（体积小、更安全）
            structlog.processors.JSONRenderer(ensure_ascii=not is_dev)
        ],
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
    )
