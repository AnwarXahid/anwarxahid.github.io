CREATE TABLE IF NOT EXISTS quick_pass (
  name TEXT PRIMARY KEY,
  salt TEXT NOT NULL,
  iv TEXT NOT NULL,
  pass_hash TEXT NOT NULL,
  ciphertext TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS quick_pass_expiry ON quick_pass(expires_at);
