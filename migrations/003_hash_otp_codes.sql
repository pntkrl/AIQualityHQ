-- 003_hash_otp_codes.sql: Hash OTP codes and add email verification support

-- Add email verification and OTP columns to users
ALTER TABLE users ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN verification_code TEXT;
ALTER TABLE users ADD COLUMN verification_code_hash TEXT;
ALTER TABLE users ADD COLUMN code_expires_at TEXT;

-- Add composite index for usage_logs rate limiting (replaces COUNT(*) full scan)
CREATE INDEX IF NOT EXISTS idx_usage_logs_key_timestamp ON usage_logs(api_key_id, timestamp);

-- Add index for email_verified login lookup
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email, email_verified);

-- Add index for session cleanup
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
