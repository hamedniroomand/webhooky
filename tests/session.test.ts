import { afterEach, describe, expect, test } from 'bun:test';

import { config } from '@/server/config';
import { getStore } from '@/server/store-instance';

import { startTestServer, type TestServer } from './helpers';

let server: TestServer | undefined;

afterEach(() => {
  server?.stop();
  server = undefined;
});

describe('session', () => {
  test('first request without cookie receives Set-Cookie with HttpOnly and SameSite', async () => {
    server = startTestServer();
    const res = await fetch(`${server.baseUrl}/api/session`);
    const cookie = res.headers.get('set-cookie') ?? '';
    expect(cookie).toContain(`${config.sessionCookieName}=`);
    expect(cookie.toLowerCase()).toContain('httponly');
    expect(cookie.toLowerCase()).toContain('samesite=lax');
  });

  test('cookie value is not a webhook token', async () => {
    server = startTestServer();
    const sessionRes = await fetch(`${server.baseUrl}/api/session`);
    const cookie = sessionRes.headers.get('set-cookie') ?? '';
    const secret = decodeURIComponent(/webhooky_session=([^;]+)/.exec(cookie)?.[1] ?? '');
    const createRes = await fetch(`${server.baseUrl}/api/inbox`, {
      method: 'POST',
      headers: { cookie: `webhooky_session=${encodeURIComponent(secret)}` },
    });
    const inbox = (await createRes.json()) as { token: string };
    expect(secret).not.toBe(inbox.token);
    const bodyText = JSON.stringify(await sessionRes.clone().json());
    expect(bodyText).not.toContain(secret);
  });

  test('second request with cookie resolves to same session row', async () => {
    server = startTestServer();
    const first = await fetch(`${server.baseUrl}/api/session`);
    const cookie = first.headers.get('set-cookie') ?? '';
    const countBefore = getStore()
      .db.query('SELECT COUNT(*) AS c FROM management_sessions')
      .get() as { c: number };
    await fetch(`${server.baseUrl}/api/session`, {
      headers: { cookie: cookie.split(';')[0] ?? '' },
    });
    const countAfter = getStore()
      .db.query('SELECT COUNT(*) AS c FROM management_sessions')
      .get() as { c: number };
    expect(countAfter.c).toBe(countBefore.c);
  });
});

describe('§61 management denial', () => {
  test('public token alone cannot list requests', async () => {
    server = startTestServer();
    const session = getStore().createSession();
    const inbox = getStore().createInbox(session.id);
    const res = await fetch(
      `${server.baseUrl}/api/inbox/${encodeURIComponent(inbox.publicToken)}/requests`,
    );
    expect(res.status).toBe(401);
  });

  test('foreign session receives same denial as unknown inbox', async () => {
    server = startTestServer();
    const owner = getStore().createSession();
    const other = getStore().createSession();
    const inbox = getStore().createInbox(owner.id);
    const foreign = await fetch(
      `${server.baseUrl}/api/inbox/${encodeURIComponent(inbox.publicToken)}/requests`,
      {
        headers: {
          cookie: `${config.sessionCookieName}=${encodeURIComponent(other.secret)}`,
        },
      },
    );
    const missing = await fetch(`${server.baseUrl}/api/inbox/not-a-real-token/requests`, {
      headers: {
        cookie: `${config.sessionCookieName}=${encodeURIComponent(other.secret)}`,
      },
    });
    expect(foreign.status).toBe(404);
    expect(await foreign.text()).toBe(await missing.text());
  });
});
