import { beforeEach, describe, expect, test } from 'bun:test';

import { config } from '@/server/config';
import { generateSessionSecret, generateWebhookToken } from '@/server/ids';
import { createStore, type Store } from '@/server/store';

let store: Store;

beforeEach(() => {
  store = createStore(':memory:');
});

describe('ids', () => {
  test('500 webhook tokens are unique, URL-safe, and share no common prefix', () => {
    const tokens = Array.from({ length: 500 }, () => generateWebhookToken());
    expect(new Set(tokens).size).toBe(500);
    for (const token of tokens) {
      expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    }
    const firstChars = new Set(tokens.map((t) => t.slice(0, 4)));
    expect(firstChars.size).toBeGreaterThan(100);
  });

  test('session secret and webhook token use independent generators', () => {
    const pairs = Array.from({ length: 50 }, () => ({
      secret: generateSessionSecret(),
      token: generateWebhookToken(),
    }));
    for (const { secret, token } of pairs) {
      expect(secret).not.toBe(token);
      expect(secret.startsWith(token.slice(0, 6))).toBe(false);
    }
  });
});

describe('inboxes', () => {
  test('inbox created at T expires at T + 24h', () => {
    const session = store.createSession();
    const inbox = store.createInbox(session.id);
    const delta = inbox.expiresAt.getTime() - inbox.createdAt.getTime();
    expect(delta).toBe(config.inboxLifetimeMs);
  });

  test('purge removes expired inbox and cascades requests; live inbox stays', () => {
    const session = store.createSession();
    const live = store.createInbox(session.id);
    const expired = store.createInbox(session.id);
    store.setInboxExpiresAt(expired.id, new Date(Date.now() - 1000));
    store.insertRequest(expired.id, sampleRequest('GET', '/old'));
    store.insertRequest(live.id, sampleRequest('POST', '/live'));

    store.purgeExpired();

    expect(store.getInboxById(expired.id)).toBeNull();
    expect(store.listRequests(expired.id)).toHaveLength(0);
    expect(store.getInboxById(live.id)?.status).toBe('active');
  });
});

describe('requests', () => {
  test('duplicate query parameters and ordered headers survive round trip', () => {
    const session = store.createSession();
    const inbox = store.createInbox(session.id);
    const query: [string, string][] = [
      ['source', 'stripe'],
      ['source', 'test'],
    ];
    const headers: [string, string][] = [
      ['X-A', '1'],
      ['X-B', '2'],
      ['Set-Cookie', 'a=1'],
      ['Set-Cookie', 'b=2'],
    ];
    const row = store.insertRequest(inbox.id, {
      method: 'POST',
      path: '/hook',
      query,
      headers,
      contentType: 'application/json',
      body: '{}',
      bodySize: 2,
      oversized: false,
    });
    const loaded = store.getRequest(inbox.id, row.id);
    expect(loaded?.query).toEqual(query);
    expect(loaded?.headers).toEqual(headers);
  });

  test('requests return newest first', () => {
    const session = store.createSession();
    const inbox = store.createInbox(session.id);
    const first = store.insertRequest(inbox.id, sampleRequest('GET', '/1'));
    Bun.sleepSync(5);
    const second = store.insertRequest(inbox.id, sampleRequest('GET', '/2'));
    const list = store.listRequests(inbox.id);
    expect(list.map((r) => r.id)).toEqual([second.id, first.id]);
  });

  test('inserting 105 requests keeps the newest 100', () => {
    const session = store.createSession();
    const inbox = store.createInbox(session.id);
    const ids: string[] = [];
    for (let i = 0; i < 105; i++) {
      const row = store.insertRequest(inbox.id, sampleRequest('GET', `/${i}`));
      ids.push(row.id);
      Bun.sleepSync(1);
    }
    const list = store.listRequests(inbox.id);
    expect(list).toHaveLength(100);
    const kept = new Set(list.map((r) => r.id));
    const dropped = ids.slice(0, 5);
    const survivors = ids.slice(5);
    for (const id of dropped) {
      expect(kept.has(id)).toBe(false);
    }
    for (const id of survivors) {
      expect(kept.has(id)).toBe(true);
    }
  });

  test('request from inbox A is not readable through inbox B', () => {
    const session = store.createSession();
    const a = store.createInbox(session.id);
    const b = store.createInbox(session.id);
    const row = store.insertRequest(a.id, sampleRequest('GET', '/secret'));
    expect(store.getRequest(b.id, row.id)).toBeNull();
  });

  test('clearing requests leaves inbox active', () => {
    const session = store.createSession();
    const inbox = store.createInbox(session.id);
    store.insertRequest(inbox.id, sampleRequest('GET', '/x'));
    store.clearRequests(inbox.id);
    expect(store.listRequests(inbox.id)).toHaveLength(0);
    expect(store.getInboxById(inbox.id)?.status).toBe('active');
  });

  test('malformed stored row degrades instead of throwing', () => {
    const session = store.createSession();
    const inbox = store.createInbox(session.id);
    store.insertRequest(inbox.id, sampleRequest('GET', '/ok'));
    store.db.run(`UPDATE captured_requests SET query_json = 'not-json' WHERE inbox_id = ?`, [
      inbox.id,
    ]);
    const list = store.listRequests(inbox.id);
    expect(list).toHaveLength(1);
    expect(list[0]?.query).toEqual([]);
  });
});

function sampleRequest(method: string, path: string) {
  return {
    method,
    path,
    query: [] as [string, string][],
    headers: [] as [string, string][],
    contentType: null as string | null,
    body: null as string | null,
    bodySize: 0,
    oversized: false,
  };
}
