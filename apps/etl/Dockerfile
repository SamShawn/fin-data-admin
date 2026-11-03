FROM python:3.11-slim

WORKDIR /app

# 安装 psycopg 需要的编译依赖
RUN apt-get update && apt-get install -y libpq-dev gcc && rm -rf /var/lib/apt/lists/*

# 安装 Python 依赖
COPY pyproject.toml .
RUN pip install --no-cache-dir .

# 复制源代码
COPY etl/ ./etl/

# 默认运行
CMD ["python", "-m", "etl.main"]
