# ETL 数据校验规则说明

本系统使用 YAML 配置化规则引擎对拉取的数据进行质量校验。规则文件位于 `apps/etl/config/validation/market_data.yaml`。

## 校验级别

- **`block`（阻断级）**：数据违反该规则将**直接丢弃**，并写入 `raw.staging_rejected` 隔离表，不会进入业务库。
- **`warn`（警告级）**：数据违反该规则仍会正常入库，但会在 ETL 日志中记录警告，供后续排查。

## 行情数据 (daily_quotes) 校验规则

| 字段 | 规则类型 | 参数/要求 | 级别 | 业务说明 |
| :--- | :--- | :--- | :--- | :--- |
| `stock_code` | `not_null` | 不能为空 | `block` | 股票代码是主键，不能缺失。 |
| `stock_code` | `regex` | `^\d{6}\.(SZ\|SH\|BJ)$` | `block` | 必须是标准的 A 股代码格式（如 `000001.SZ`）。 |
| `trade_date` | `not_null` | 不能为空 | `block` | 交易日期是分区键，不能缺失。 |
| `close` | `range` | `min: 0.01, max: 100000` | `block` | 收盘价必须大于 0，且不能超过十万（防止异常数据）。 |
| `pct_change` | `range` | `min: -0.2, max: 0.2` | `warn` | 涨跌幅通常在 ±20% 以内（含科创板/创业板）。若超出，可能是 ST 股或数据源异常，仅告警。 |

## 异常数据处理流程

1. 当数据被 `block` 规则拦截时，会存入 `raw.staging_rejected` 表。
2. 该表包含字段：`source`（数据源）、`reason`（拦截原因）、`payload`（原始数据的 JSON 快照）。
3. 运营人员可定期查询该表，分析是数据源问题还是规则设置过严。若确认为规则错误，可调整 YAML 文件并重新拉取。

## 修改规则的方法

1. 编辑 `apps/etl/config/validation/market_data.yaml`。
2. 增加、修改或删除对应的 `rules` 节点。
3. 重启 ETL 任务即可生效，**无需修改代码**。
