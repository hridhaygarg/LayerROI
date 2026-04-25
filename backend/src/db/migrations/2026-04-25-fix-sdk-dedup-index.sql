-- Fix: Postgres rejects partial unique indexes for ON CONFLICT inference.
-- Drop the partial index and recreate as full unique index.
-- NULLs are treated as distinct, so non-SDK rows (NULL sdk_record_id) won't conflict.
DROP INDEX IF EXISTS idx_api_logs_sdk_dedup;
CREATE UNIQUE INDEX idx_api_logs_sdk_dedup ON api_logs (org_id, sdk_record_id);
