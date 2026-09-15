import { afterEach, describe, expect, test } from 'bun:test';

import { config } from '@/server/config';

import { startTestServer, type TestServer } from './helpers';

let server: TestServer | undefined;

afterEach(() => {
  server?.stop();
  server = undefined;
});

async function withSession(serverUrl: string) {
  const res = await fetch(`${serverUrl}/api/session`);
  const cookie = res.headers.get('set-cookie')?.split(';')[0] ?? '';
  return cookie;
}

describe('management API', () => {
  test('bootstrap without cookie sets session and reports no inbox', async () => {
    server = startTestServer();
    const res = await fetch(`${server.baseUrl}/api/session`);
    const body = (await res.json()) as { inbox: null | unknown };
    expect(body.inbox).toBeNull();
    expect(res.headers.get('set-cookie')).toContain(config.sessionCookieName);
  });

  test('create inbox then bootstrap returns same token and count', async () => {
    server = startTestServer();
    const cookie = await withSession(server.baseUrl);
    const created = await fetch(`${server.baseUrl}/api/inbox`, {
      method: 'POST',
      headers: { cookie },
    });
    const inbox = (await created.json()) as { token: string };
    await fetch(`${server.baseUrl}/h/${inbox.token}`, { method: 'POST', body: '1' });
    const boot = await fetch(`${server.baseUrl}/api/session`, { headers: { cookie } });
    const body = (await boot.json()) as {
      inbox: { token: string; requestCount: number } | null;
    };
    expect(body.inbox?.token).toBe(inbox.token);
    expect(body.inbox?.requestCount).toBe(1);
  });

  test('management responses are no-store', async () => {
    server = startTestServer();
    const res = await fetch(`${server.baseUrl}/api/session`);
    expect(res.headers.get('cache-control')).toBe('no-store');
  });

  test('list endpoint omits bodies; detail includes body', async () => {
    server = startTestServer();
    const cookie = await withSession(server.baseUrl);
    const created = await fetch(`${server.baseUrl}/api/inbox`, {
      method: 'POST',
      headers: { cookie },
    });
    const inbox = (await created.json()) as { token: string };
    await fetch(`${server.baseUrl}/h/${inbox.token}`, {
      method: 'POST',
      body: 'secret-body',
    });
    const list = await fetch(
      `${server.baseUrl}/api/inbox/${encodeURIComponent(inbox.token)}/requests`,
      { headers: { cookie } },
    );
    const summaries = (await list.json()) as Record<string, unknown>[];
    expect(summaries[0]).not.toHaveProperty('body');
    const detail = await fetch(
      `${server.baseUrl}/api/inbox/${encodeURIComponent(inbox.token)}/requests/${encodeURIComponent(String(summaries[0]?.id))}`,
      { headers: { cookie } },
    );
    const full = (await detail.json()) as { body: string };
    expect(full.body).toBe('secret-body');
  });
});
