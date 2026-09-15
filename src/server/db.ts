import { Database } from 'bun:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

import { config } from '@/server/config';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS management_sessions (
  id TEXT PRIMARY KEY NOT NULL,
  secret TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL,
  last_used_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS inboxes (
  id TEXT PRIMARY KEY NOT NULL,
  public_token TEXT NOT NULL UNIQUE,
  session_id TEXT NOT NULL REFERENCES management_sessions(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  last_activity_at INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'expired', 'deleted'))
);

CREATE INDEX IF NOT EXISTS idx_inboxes_session ON inboxes(session_id);
CREATE INDEX IF NOT EXISTS idx_inboxes_expires ON inboxes(expires_at);

CREATE TABLE IF NOT EXISTS captured_requests (
  id TEXT PRIMARY KEY NOT NULL,
  inbox_id TEXT NOT NULL REFERENCES inboxes(id) ON DELETE CASCADE,
  method TEXT NOT NULL,
  path TEXT NOT NULL,
  query_json TEXT NOT NULL,
  headers_json TEXT NOT NULL,
  content_type TEXT,
  body TEXT,
  body_size INTEGER NOT NULL,
  oversized INTEGER NOT NULL DEFAULT 0,
  received_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_requests_inbox_received
  ON captured_requests(inbox_id, received_at DESC);
`;

export function openDatabase(path?: string): Database {
  const target = path ?? config.dbPath;
  if (target !== ':memory:') {
    mkdirSync(dirname(target), { recursive: true });
  }
  const db = new Database(target);
  db.run('PRAGMA journal_mode = WAL');
  db.run('PRAGMA foreign_keys = ON');
  db.run(SCHEMA);
  return db;
}
