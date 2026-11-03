from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from .config import settings

DATABASE_URL = f"postgresql+psycopg://{settings.db_user}:{settings.db_password}@{settings.db_host}:{settings.db_port}/{settings.db_name}"

# pool_pre_ping 确保长时间运行不断连
engine = create_engine(DATABASE_URL, pool_pre_ping=True, pool_size=5)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
