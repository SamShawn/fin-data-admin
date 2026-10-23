-- 创建业务 schema 分层
CREATE SCHEMA IF NOT EXISTS raw;
CREATE SCHEMA IF NOT EXISTS processed;

-- 扩展：UUID 生成
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 扩展：慢查询性能分析（对应 Sprint 5 的索引优化）
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- 配置 pg_stat_statements（本地开发环境）
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET pg_stat_statements.track = 'all';
