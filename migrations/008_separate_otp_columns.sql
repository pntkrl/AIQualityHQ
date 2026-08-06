-- 008_separate_otp_columns.sql: Separate OTP columns for email verify vs password reset
-- Prevents cross-use of verification codes between email verify and password reset flows

-- Add dedicated password reset columns
ALTER TABLE users ADD COLUMN reset_code_hash TEXT;
ALTER TABLE users ADD COLUMN reset_code_expires_at TEXT;

-- Migrate existing reset codes (if any) — these come from forgot-password
-- Email verification codes stay in verification_code_hash/code_expires_at
-- Password reset codes move to reset_code_hash/reset_code_expires_at

-- Add index for password reset lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
