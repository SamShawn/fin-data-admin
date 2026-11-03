from .logger import setup_logging
from .config import settings
from .db import engine
import structlog

# 初始化日志
setup_logging()
logger = structlog.get_logger()

def main():
    logger.info("ETL Pipeline Starting", env_db=settings.db_name)

    try:
        with engine.connect() as conn:
            logger.info("Database connection test successful")
    except Exception as e:
        logger.error("Database connection failed", error=str(e))
        return

if __name__ == "__main__":
    main()
