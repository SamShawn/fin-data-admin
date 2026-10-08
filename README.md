# 金融数据后台管理系统

为量化/投研团队提供股票数据管理、策略配置与可视化分析的全栈后台系统。

## 技术栈
- 前端：React 18 + TypeScript + Vite
- 后端：NestJS + TypeScript + PostgreSQL + Redis
- ETL：Python 3.11 + SQLAlchemy
- 工程：pnpm workspace + Turborepo

## 快速开始
见下方「开发」章节（骨架建立后补充）。

## 目录结构
- `apps/`：可独立部署的应用
- `packages/`：共享库（类型、工具、配置）
- `infra/`：Docker、迁移、CI 配置
- `docs/`：项目文档

## 文档索引
- [架构文档](docs/architecture.md)
- [接口契约](docs/api-contract.md)
