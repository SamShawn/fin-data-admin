from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    db_host: str = "localhost"
    db_port: int = 5432
    db_user: str = "fin"
    db_password: str = "fin_dev"
    db_name: str = "fin_data"
    tushare_token: str = ""
    log_level: str = "INFO"

    model_config = SettingsConfigDict(
        # 向上寻找到 monorepo 的根目录 .env
        env_file=str(Path(__file__).resolve().parent.parent.parent.parent / ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
