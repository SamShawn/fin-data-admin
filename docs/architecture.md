# 金融数据后台管理系统 - 架构设计文档

## 1. 系统定位
为量化/投研团队提供股票数据管理、策略配置与可视化分析的全栈后台系统。

## 2. 技术栈总览
- **前端**：React 18 + TypeScript + Vite + TanStack Table/Virtual + Ant Design + Zustand
- **后端**：NestJS + TypeORM + PostgreSQL 15 + Redis 7
- **ETL**：Python 3.11 + SQLAlchemy + pandas + Tushare
- **工程化**：pnpm Monorepo + Turborepo + GitHub Actions + Docker

## 3. 架构图
```text
[浏览器 React]
      ↓
   [Nginx]
      ↓
[NestJS API] ⇄ [Redis 缓存]
      ↓
[PostgreSQL 分区表]
      ↑
[Python ETL] → [外部数据源 Tushare]
```


## 4. 核心模块划分

- **Auth (认证)**：JWT 登录、无感刷新、登出黑名单。
- **RBAC (权限)**：用户-角色-权限三层模型，支持通配符与数据范围。
- **Audit (审计)**：AOP 拦截器自动记录变更快照，数据库触发器防篡改。
- **Market Data (行情)**：百万级数据游标分页、虚拟滚动、流式导出。
- **ETL (数据管道)**：按日拉取、YAML 规则校验、自动分区、幂等入库。

## 5. 关键架构决策

| 决策点 | 方案 | 理由 |
| --- | --- | --- |
| 分页策略 | 游标分页 (Cursor) | 避免 OFFSET 深分页导致的数据库全表扫描 |
| 权限控制 | 装饰器 + 全局 Guard | 声明式接入，业务代码零侵入，默认安全 |
| 审计日志 | JSONB 快照 + 触发器 | 满足金融合规要求，防篡改（禁止 UPDATE/DELETE） |
| ETL 幂等 | `ON CONFLICT DO UPDATE` | 应对数据源修正与重复拉取，保证数据最终一致性 |
| 依赖管理 | pnpm Monorepo + overrides | 统一全栈 TS 版本，杜绝多版本冲突 |

## 6. 性能指标（实测）

- 核心行情接口：热数据 **P95 9ms** (QPS 536)，冷数据 **P95 112ms**。
- 首屏加载：1.2s（优化前 8s）。
- 导出 10 万行 CSV：6s（优化前 90s）。
