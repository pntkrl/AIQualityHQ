-- 007_cleanup_dead_columns_and_admin_indexes.sql
-- Remove dead razorpay_subscription_id column, add admin query indexes

-- SQLite doesn't support DROP COLUMN directly before 3.35.
-- For D1 (SQLite 3.39+), we can use ALTER TABLE DROP COLUMN.
-- If this fails on older SQLite, recreate the table instead.

-- Remove dead Razorpay column from subscriptions
ALTER TABLE subscriptions DROP COLUMN razorpay_subscription_id;

-- Add composite indexes for admin query patterns
CREATE INDEX IF NOT EXISTS idx_users_email_created ON users(email, created_at);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_status ON subscriptions(plan, status);
CREATE INDEX IF NOT EXISTS idx_usage_logs_endpoint_timestamp ON usage_logs(endpoint, timestamp);
CREATE INDEX IF NOT EXISTS idx_api_keys_active_last_used ON api_keys(active, last_used_at);
