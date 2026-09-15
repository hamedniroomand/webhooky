import { afterEach, describe, expect, test } from 'bun:test';

import { getStore } from '@/server/store-instance';

import { startTestServer, type TestServer } from './helpers';

let server: TestServer | undefined;

afterEach(() => {
  server?.stop();
  server = undefined;
});

describe('capture', () => {
  test('captures GET/POST and returns 200', async () => {
    server = startTestServer();
    const { baseUrl } = server;
    const session = getStore().createSession();
    const inbox = getStore().createInbox(session.id);

    await Promise.all(
      (['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const).map(async (method) => {
        const init: RequestInit = { method };
        if (method !== 'GET') {
          init.body = 'hi';
        }
        const res = await fetch(`${baseUrl}/h/${inbox.publicToken}/x`, init);
        expect(res.status).toBe(200);
      }),
    );
  });

  test('records path and duplicate query values', async () => {
    server = startTestServer();
    const session = getStore().createSession();
    const inbox = getStore().createInbox(session.id);
    await fetch(`${server.baseUrl}/h/${inbox.publicToken}/orders?source=stripe&source=test`, {
      method: 'POST',
      body: '{}',
    });
    const row = getStore().listRequests(inbox.id)[0];
    expect(row?.path).toBe('/orders');
    expect(row?.query).toEqual([
      ['source', 'stripe'],
      ['source', 'test'],
    ]);
  });

  test('does not store client IP in captured row', async () => {
    server = startTestServer();
    const session = getStore().createSession();
    const inbox = getStore().createInbox(session.id);
    await fetch(`${server.baseUrl}/h/${inbox.publicToken}`, {
      method: 'POST',
      body: 'payload',
      headers: { 'X-Forwarded-For': '203.0.113.1' },
    });
    const row = getStore().listRequests(inbox.id)[0];
    const blob = JSON.stringify(row);
    expect(blob).not.toContain('203.0.113.1');
  });

  test('unknown token returns 404 JSON', async () => {
    server = startTestServer();
    const res = await fetch(`${server.baseUrl}/h/does-not-exist`, {
      method: 'POST',
    });
    expect(res.headers.get('content-type')).toContain('application/json');
    expect(res.status).toBe(404);
  });
});
