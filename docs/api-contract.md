# API 接口契约

## 通用约定
- Base URL: `/api`
- 认证: 请求头 `Authorization: Bearer <accessToken>`
- 响应格式: `{ code: number, message: string, data: T, requestId: string }`
- 错误码: 40100 (未认证), 40300 (无权限), 42200 (参数错误)

## 1. 认证模块 (`/auth`)
- `POST /login`: 登录，返回 `accessToken`, `refreshToken`, `user`。
- `POST /refresh`: 刷新 Token。
- `POST /logout`: 登出（将 Token 加入 Redis 黑名单）。

## 2. 行情数据模块 (`/market-data`)
- `GET /`: 游标分页查询。
  - Query 参数: `cursor`, `limit`, `stockCode`, `startDate`, `endDate`, `industry`, `minPctChange`, `maxPctChange`, `sort`。
- `GET /export`: 流式导出 CSV（需 `sys:market_data:export` 权限）。

## 3. 策略配置模块 (`/strategies`)
- `GET /`: 获取策略列表。
- `POST /`: 创建策略（JSON 参数存储于 JSONB）。
- `PUT /:id`: 更新策略。
- `DELETE /:id`: 删除策略。

## 4. 系统管理模块 (`/admin`)
- `GET /users`: 用户分页查询。
- `POST /users`: 创建用户并分配角色。
- `GET /roles`: 角色列表。
- `PUT /roles/:id/permissions`: 为角色分配权限。
- `GET /audit-logs`: 查询操作审计日志。
