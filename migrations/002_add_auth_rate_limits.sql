-- 002_add_auth_rate_limits.sql: Add rate limiting table for auth endpoints

CREATE TABLE IF NOT EXISTS auth_rate_limits (
  id TEXT PRIMARY KEY,
  ip TEXT NOT NULL,
  action TEXT NOT NULL,
  timestamp TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_auth_rate_limits_ip_action ON auth_rate_limits(ip, action, timestamp);
