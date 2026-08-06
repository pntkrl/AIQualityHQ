-- 004_cleanup_and_session_cron.sql: Schema cleanup and session maintenance

-- Remove dead razorpay_subscription_id column
-- Note: D1 SQLite doesn't support ALTER TABLE DROP COLUMN directly
-- This will be handled by creating a new table and migrating data if needed
-- For now, we document the column as deprecated

-- Add index for session cleanup cron job
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- Add index for admin audit queries
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
