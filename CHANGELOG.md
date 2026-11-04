# CHANGELOG

## [v0.3.0] - 2026-11-04
### Features
- 完成 ETL 数据管道：按日拉取、清洗、YAML 配置化校验、幂等入库。
- 实现自动建分区与定时调度，ETL 具备无人值守能力。
- 补充行情数据复合索引，查询性能提升 10 倍。

## [v0.2.0] - 2026-10-30
### Features
- 实现百万级行情数据游标分页、流式 CSV 导出。
- 实现前端虚拟滚动表格（VirtualTable）、动态列配置。
- 实现策略配置模块（JSONB 存储）。
- 完成 RBAC 权限体系与操作审计日志。

## [v0.1.0] - 2026-10-26
### Features
- 初始化 Monorepo 工程骨架（pnpm + Turborepo）。
- 搭建 NestJS 后端骨架与 React 前端骨架，完成 /health 联调。
- 配置 CI 基础流水线（Lint + Typecheck）。
