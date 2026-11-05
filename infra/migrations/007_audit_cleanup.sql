-- 1. 移除禁止删除的触发器（保留禁止更新的触发器）
DROP TRIGGER IF EXISTS no_delete_audit_logs ON audit_logs;

-- 2. 重新创建（或确保只保留防修改触发器）
DROP TRIGGER IF EXISTS no_update_audit_logs ON audit_logs;

CREATE TRIGGER no_update_audit_logs
BEFORE UPDATE ON audit_logs
FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_modification();
