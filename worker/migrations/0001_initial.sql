PRAGMA foreign_keys = ON;
CREATE TABLE quizzes (
 id TEXT PRIMARY KEY, code TEXT NOT NULL UNIQUE, creator_hash TEXT NOT NULL UNIQUE,
 title TEXT NOT NULL, subject TEXT NOT NULL, audience TEXT NOT NULL, language TEXT NOT NULL, instructions TEXT NOT NULL,
 settings TEXT NOT NULL, start_at INTEGER, end_at INTEGER, host_controlled INTEGER NOT NULL,
 closed_at INTEGER, score_released INTEGER NOT NULL DEFAULT 0, keys_released INTEGER NOT NULL DEFAULT 0,
 created_at INTEGER NOT NULL, expires_at INTEGER NOT NULL
);
CREATE INDEX quiz_expiry ON quizzes(expires_at);
CREATE TABLE versions (
 id TEXT PRIMARY KEY, quiz_id TEXT NOT NULL UNIQUE REFERENCES quizzes(id) ON DELETE CASCADE,
 content TEXT NOT NULL, public_questions TEXT NOT NULL, answer_shape TEXT NOT NULL
);
CREATE TABLE attempts (
 id TEXT PRIMARY KEY, quiz_id TEXT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
 version_id TEXT NOT NULL REFERENCES versions(id) ON DELETE CASCADE,
 token_hash TEXT NOT NULL UNIQUE, join_key TEXT NOT NULL, nickname TEXT NOT NULL,
 status TEXT NOT NULL CHECK(status IN ('created','started','submitted','expired')),
 created_at INTEGER NOT NULL, started_at INTEGER, deadline INTEGER, submitted_at INTEGER,
 revision INTEGER NOT NULL DEFAULT 0, answers TEXT NOT NULL DEFAULT '{}', manual TEXT NOT NULL DEFAULT '{}',
 submit_key TEXT, last_save_at INTEGER NOT NULL DEFAULT 0, expires_at INTEGER NOT NULL,
 UNIQUE(quiz_id,join_key)
);
CREATE INDEX attempt_quiz ON attempts(quiz_id,id);
CREATE INDEX attempt_expiry ON attempts(expires_at);
CREATE INDEX attempt_deadline ON attempts(status,deadline);
CREATE TABLE budgets (key TEXT PRIMARY KEY, count INTEGER NOT NULL, expires_at INTEGER NOT NULL);
CREATE INDEX budget_expiry ON budgets(expires_at);
CREATE TABLE ai_jobs (
 id TEXT PRIMARY KEY, token_hash TEXT NOT NULL UNIQUE, owner_hash TEXT NOT NULL,
 state TEXT NOT NULL CHECK(state IN ('queued','leased','completed','failed','expired')),
 input TEXT, output TEXT, error TEXT, created_at INTEGER NOT NULL, expires_at INTEGER NOT NULL,
 lease_hash TEXT, lease_until INTEGER, tries INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX jobs_queue ON ai_jobs(state,created_at);
CREATE INDEX jobs_owner ON ai_jobs(owner_hash,created_at);
CREATE INDEX jobs_expiry ON ai_jobs(expires_at);
CREATE TABLE agent_status (id INTEGER PRIMARY KEY CHECK(id=1), heartbeat INTEGER NOT NULL, available INTEGER NOT NULL);
