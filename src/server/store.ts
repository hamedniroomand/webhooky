import type { Database } from 'bun:sqlite';

import { config } from '@/server/config';
import { openDatabase } from '@/server/db';
import { generateRowId, generateSessionSecret, generateWebhookToken } from '@/server/ids';
import type { CapturedRequest, Inbox, InboxStatus, ManagementSession, Pair } from '@/server/types';

export type NewCapturedRequest = {
  method: string;
  path: string;
  query: Pair[];
  headers: Pair[];
  contentType: string | null;
  body: string | null;
  bodySize: number;
  oversized: boolean;
};

export type Store = {
  db: Database;
  createSession(): ManagementSession;
  getSessionBySecret(secret: string): ManagementSession | null;
  touchSession(sessionId: string): void;
  createInbox(sessionId: string): Inbox;
  getInboxById(inboxId: string): Inbox | null;
  getInboxByToken(token: string): Inbox | null;
  getActiveInboxForSession(sessionId: string): Inbox | null;
  listInboxesForSession(sessionId: string): Inbox[];
  insertRequest(inboxId: string, input: NewCapturedRequest): CapturedRequest;
  listRequests(inboxId: string): CapturedRequest[];
  getRequest(inboxId: string, requestId: string): CapturedRequest | null;
  clearRequests(inboxId: string): void;
  markInboxDeleted(inboxId: string): void;
  purgeExpired(): void;
  setInboxExpiresAt(inboxId: string, at: Date): void;
};

export function createStore(path?: string): Store {
  const db = openDatabase(path ?? config.dbPath);

  const getSessionBySecretStmt = db.prepare(`
    SELECT id, secret, created_at, last_used_at, expires_at
    FROM management_sessions WHERE secret = ?
  `);

  const insertSession = db.prepare(`
    INSERT INTO management_sessions (id, secret, created_at, last_used_at, expires_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  const touchSessionStmt = db.prepare(`
    UPDATE management_sessions SET last_used_at = ? WHERE id = ?
  `);

  const getInbox = db.prepare(`
    SELECT id, public_token, session_id, created_at, expires_at, last_activity_at, status
    FROM inboxes WHERE id = ?
  `);

  const getInboxByTokenStmt = db.prepare(`
    SELECT id, public_token, session_id, created_at, expires_at, last_activity_at, status
    FROM inboxes WHERE public_token = ?
  `);

  const insertInbox = db.prepare(`
    INSERT INTO inboxes (
      id, public_token, session_id, created_at, expires_at, last_activity_at, status
    ) VALUES (?, ?, ?, ?, ?, ?, 'active')
  `);

  const insertRequestStmt = db.prepare(`
    INSERT INTO captured_requests (
      id, inbox_id, method, path, query_json, headers_json,
      content_type, body, body_size, oversized, received_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const listRequestsStmt = db.prepare(`
    SELECT id, inbox_id, method, path, query_json, headers_json,
      content_type, body, body_size, oversized, received_at
    FROM captured_requests
    WHERE inbox_id = ?
    ORDER BY received_at DESC
  `);

  const getRequestStmt = db.prepare(`
    SELECT id, inbox_id, method, path, query_json, headers_json,
      content_type, body, body_size, oversized, received_at
    FROM captured_requests
    WHERE inbox_id = ? AND id = ?
  `);

  const trimRequests = db.prepare(`
    DELETE FROM captured_requests
    WHERE inbox_id = ?1
      AND id IN (
        SELECT id FROM captured_requests
        WHERE inbox_id = ?1
        ORDER BY received_at ASC
        LIMIT MAX(0, (SELECT COUNT(*) FROM captured_requests WHERE inbox_id = ?1) - ?2)
      )
  `);

  function rowToSession(row: Record<string, unknown>): ManagementSession {
    return {
      id: String(row.id),
      secret: String(row.secret),
      createdAt: new Date(Number(row.created_at)),
      lastUsedAt: new Date(Number(row.last_used_at)),
      expiresAt: new Date(Number(row.expires_at)),
    };
  }

  function rowToInbox(row: Record<string, unknown>): Inbox {
    return {
      id: String(row.id),
      publicToken: String(row.public_token),
      sessionId: String(row.session_id),
      createdAt: new Date(Number(row.created_at)),
      expiresAt: new Date(Number(row.expires_at)),
      lastActivityAt: new Date(Number(row.last_activity_at)),
      status: String(row.status) as InboxStatus,
    };
  }

  function parsePairs(raw: string): Pair[] {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return [];
      }
      const out: Pair[] = [];
      for (const item of parsed) {
        if (
          Array.isArray(item) &&
          item.length === 2 &&
          typeof item[0] === 'string' &&
          typeof item[1] === 'string'
        ) {
          out.push([item[0], item[1]]);
        }
      }
      return out;
    } catch {
      return [];
    }
  }

  function rowToRequest(row: Record<string, unknown>): CapturedRequest {
    return {
      id: String(row.id),
      inboxId: String(row.inbox_id),
      method: String(row.method),
      path: String(row.path),
      query: parsePairs(String(row.query_json)),
      headers: parsePairs(String(row.headers_json)),
      contentType: row.content_type == null ? null : String(row.content_type),
      body: row.body == null ? null : String(row.body),
      bodySize: Number(row.body_size),
      oversized: Number(row.oversized) === 1,
      receivedAt: new Date(Number(row.received_at)),
    };
  }

  function createSession(): ManagementSession {
    const now = Date.now();
    const session: ManagementSession = {
      id: generateRowId(),
      secret: generateSessionSecret(),
      createdAt: new Date(now),
      lastUsedAt: new Date(now),
      expiresAt: new Date(now + config.sessionMaxAgeSeconds * 1000),
    };
    insertSession.run(
      session.id,
      session.secret,
      session.createdAt.getTime(),
      session.lastUsedAt.getTime(),
      session.expiresAt.getTime(),
    );
    return session;
  }

  function getSessionBySecret(secret: string): ManagementSession | null {
    const row = getSessionBySecretStmt.get(secret) as Record<string, unknown> | undefined;
    return row ? rowToSession(row) : null;
  }

  function touchSession(sessionId: string): void {
    touchSessionStmt.run(Date.now(), sessionId);
  }

  function createInbox(sessionId: string): Inbox {
    const now = Date.now();
    const inbox: Inbox = {
      id: generateRowId(),
      publicToken: generateWebhookToken(),
      sessionId,
      createdAt: new Date(now),
      expiresAt: new Date(now + config.inboxLifetimeMs),
      lastActivityAt: new Date(now),
      status: 'active',
    };
    insertInbox.run(
      inbox.id,
      inbox.publicToken,
      inbox.sessionId,
      inbox.createdAt.getTime(),
      inbox.expiresAt.getTime(),
      inbox.lastActivityAt.getTime(),
    );
    return inbox;
  }

  function getInboxById(inboxId: string): Inbox | null {
    const row = getInbox.get(inboxId) as Record<string, unknown> | undefined;
    return row ? rowToInbox(row) : null;
  }

  function getInboxByToken(token: string): Inbox | null {
    const row = getInboxByTokenStmt.get(token) as Record<string, unknown> | undefined;
    return row ? rowToInbox(row) : null;
  }

  function getActiveInboxForSession(sessionId: string): Inbox | null {
    const rows = db
      .query(
        `SELECT id, public_token, session_id, created_at, expires_at, last_activity_at, status
         FROM inboxes
         WHERE session_id = ? AND status = 'active'
         ORDER BY created_at DESC`,
      )
      .all(sessionId) as Record<string, unknown>[];
    const first = rows[0];
    return first ? rowToInbox(first) : null;
  }

  function listInboxesForSession(sessionId: string): Inbox[] {
    const rows = db
      .query(
        `SELECT id, public_token, session_id, created_at, expires_at, last_activity_at, status
         FROM inboxes WHERE session_id = ? ORDER BY created_at DESC`,
      )
      .all(sessionId) as Record<string, unknown>[];
    return rows.map(rowToInbox);
  }

  function insertRequest(inboxId: string, input: NewCapturedRequest): CapturedRequest {
    const id = generateRowId();
    const receivedAt = Date.now();
    insertRequestStmt.run(
      id,
      inboxId,
      input.method,
      input.path,
      JSON.stringify(input.query),
      JSON.stringify(input.headers),
      input.contentType,
      input.body,
      input.bodySize,
      input.oversized ? 1 : 0,
      receivedAt,
    );
    trimRequests.run(inboxId, config.maxStoredRequests);
    db.run(`UPDATE inboxes SET last_activity_at = ? WHERE id = ?`, [receivedAt, inboxId]);
    return {
      id,
      inboxId,
      method: input.method,
      path: input.path,
      query: input.query,
      headers: input.headers,
      contentType: input.contentType,
      body: input.body,
      bodySize: input.bodySize,
      oversized: input.oversized,
      receivedAt: new Date(receivedAt),
    };
  }

  function listRequests(inboxId: string): CapturedRequest[] {
    const rows = listRequestsStmt.all(inboxId) as Record<string, unknown>[];
    return rows.map(rowToRequest);
  }

  function getRequest(inboxId: string, requestId: string): CapturedRequest | null {
    const row = getRequestStmt.get(inboxId, requestId) as Record<string, unknown> | undefined;
    return row ? rowToRequest(row) : null;
  }

  function clearRequests(inboxId: string): void {
    db.run(`DELETE FROM captured_requests WHERE inbox_id = ?`, [inboxId]);
  }

  function markInboxDeleted(inboxId: string): void {
    db.run(`UPDATE inboxes SET status = 'deleted' WHERE id = ?`, [inboxId]);
    clearRequests(inboxId);
  }

  function purgeExpired(): void {
    const now = Date.now();
    db.run(`DELETE FROM management_sessions WHERE expires_at < ?`, [now]);
    db.run(`DELETE FROM inboxes WHERE expires_at < ? OR status = 'expired'`, [now]);
  }

  function setInboxExpiresAt(inboxId: string, at: Date): void {
    db.run(`UPDATE inboxes SET expires_at = ? WHERE id = ?`, [at.getTime(), inboxId]);
  }

  return {
    db,
    createSession,
    getSessionBySecret,
    touchSession,
    createInbox,
    getInboxById,
    getInboxByToken,
    getActiveInboxForSession,
    listInboxesForSession,
    insertRequest,
    listRequests,
    getRequest,
    clearRequests,
    markInboxDeleted,
    purgeExpired,
    setInboxExpiresAt,
  };
}
