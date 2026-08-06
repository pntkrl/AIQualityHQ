-- 005_add_csrf_token.sql: Add CSRF token to sessions for cross-site request forgery protection

-- Add CSRF token column to sessions table
ALTER TABLE sessions ADD COLUMN csrf_token TEXT;

-- Create index for faster CSRF lookups
CREATE INDEX IF NOT EXISTS idx_sessions_token_csrf ON sessions(token, csrf_token);
