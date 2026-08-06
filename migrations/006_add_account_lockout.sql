-- 006_add_account_lockout.sql: Account lockout after failed login attempts

-- Add lockout fields to users table
ALTER TABLE users ADD COLUMN failed_login_attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN locked_until TEXT;
ALTER TABLE users ADD COLUMN last_failed_login TEXT;
