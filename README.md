# Fin Data Admin

为量化/投研团队提供股票数据管理、策略配置与可视化分析的全栈后台系统。

## 核心特性
- **百万级数据表格**：游标分页 + 虚拟滚动，热数据查询 P95 延迟 9ms。
- **金融级安全**：RBAC 细粒度权限、操作审计防篡改（数据库触发器）。
- **自动化数据管道**：Python ETL 定时拉取、YAML 规则校验、自动建分区、幂等入库。
- **大厂级工程化**：Monorepo、Turborepo、GitHub Actions CI/CD、Docker 多阶段构建。

## 快速开始
```bash
# 1. 环境准备
nvm use
pnpm install
cp .env.example .env

# 2. 拉起数据库依赖 (PG + Redis)
pnpm infra:up

# 3. 数据库迁移与初始化
pnpm db:migrate && pnpm db:seed

# 4. 启动前后端
pnpm dev
# 前端: <http://localhost:5173>
# 后端: <http://localhost:3000/api/health>
```

## 文档索引

- [架构设计](docs/architecture.md)
- [接口契约](docs/api-contract.md)
- [ETL 校验规则](docs/etl-rules.md)
- [运维手册](docs/runbook.md)
- [性能压测报告](docs/perf-report.md)

## 默认账号

- 用户名：`admin`
- 密码：`admin123`
