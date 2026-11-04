FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable

# 1. 拷贝依赖清单和配置文件（新增 turbo.json）
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY apps/api/package.json apps/api/
COPY packages/shared-types/package.json packages/shared-types/

# 2. 安装依赖时忽略 prepare 脚本（防止 husky/turbo 报错）
RUN pnpm install --frozen-lockfile --filter @fin/api... --ignore-scripts

# 3. 复制全部源码并构建
COPY . .
RUN pnpm build --filter @fin/shared-types --filter @fin/api

# 生产运行环境
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/node_modules ./node_modules
COPY --from=builder /app/apps/api/package.json ./package.json

EXPOSE 3000
CMD ["node", "dist/main"]
