# ETL 运维手册 (Runbook)

本文档用于指导开发或运维人员在 ETL 任务发生异常时，如何快速定位和恢复。

## 1. 任务状态监控

- **日志查看**：ETL 任务通过 `structlog` 输出 JSON 格式的结构化日志。重点关注 `level: error` 的记录。
- **任务触发**：
  - **定时**：每天 18:00 自动同步行情数据。
  - **手动补数**：`python -m etl.main YYYY-MM-DD`。

## 2. 常见故障与处理预案

### 症状 A：拉取数据失败（Tushare API 报错）
- **日志特征**：`Tushare 请求失败，正在重试...` 或 `拉取数据失败，重试 3 次后放弃`。
- **可能原因**：Tushare Token 过期、账户积分不足导致限流、网络抖动。
- **处理步骤**：
  1. 登录 Tushare 官网，确认 Token 是否有效、积分是否正常。
  2. 检查 `.env` 中的 `TUSHARE_TOKEN` 是否正确。
  3. 若因限流，ETL 内置了指数退避重试，可稍等片刻再手动触发补数。

### 症状 B：数据入库失败（数据库报错）
- **日志特征**：`sqlalchemy.exc.IntegrityError` 或 `psycopg.errors.CheckViolation`。
- **可能原因**：
  1. 分区表缺失（如写入 2027 年数据，但未建分区）。
  2. 数据库连接断开。
- **处理步骤**：
  1. 如果是分区缺失：我们已内置 `ensure_partitions` 自动建分区逻辑，通常无需人工干预。若仍报错，请手动进入数据库检查 `daily_quotes` 的分区情况。
  2. 检查 `.env` 中的数据库连接配置是否正确。
  3. 检查 PostgreSQL 容器是否正常运行：`docker ps | grep fin-postgres`。

### 症状 C：数据被大量隔离（校验拦截）
- **日志特征**：`存在校验失败数据被隔离 rejected_count=xxx`。
- **可能原因**：数据源发生变更（如字段单位变化）、或者交易所调整了规则。
- **处理步骤**：
  1. 查询隔离表查看被拦截数据：
     ```sql
     SELECT * FROM raw.staging_rejected ORDER BY created_at DESC LIMIT 10;
     ```
  2. 对比 `payload` 中的原始数据，看是哪个字段触发了规则。
  3. 如果是数据源正常变更（例如某只股票价格合法超过 10 万），则修改 `apps/etl/config/validation/market_data.yaml` 放宽规则。

## 3. 紧急恢复与补数

如果发现某几天的历史数据缺失，请使用**手动补数模式**重新拉取：

```bash
cd apps/etl
source .venv/bin/activate
python -m etl.main 2023-10-01
```

注：由于我们实现了 ON CONFLICT DO UPDATE 幂等入库，重复补数绝不会产生脏数据。
