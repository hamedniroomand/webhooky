import { afterEach, describe, expect, test } from 'bun:test';
import { existsSync } from 'node:fs';

import { startTestServer, type TestServer } from './helpers';

let server: TestServer | undefined;

afterEach(() => {
  server?.stop();
  server = undefined;
});

describe('route namespaces', () => {
  test('/h/:token returns JSON, never HTML', async () => {
    server = startTestServer();
    const res = await fetch(`${server.baseUrl}/h/some-token`);
    const type = res.headers.get('content-type') ?? '';
    expect(type).toContain('application/json');
    expect(type).not.toContain('text/html');
  });

  test('/h/:token/nested/path reaches capture namespace', async () => {
    server = startTestServer();
    const { getStore } = await import('@/server/store-instance');
    const inbox = getStore().createInbox(getStore().createSession().id);
    const res = await fetch(`${server.baseUrl}/h/${inbox.publicToken}/orders/items`, {
      method: 'POST',
    });
    expect(res.headers.get('content-type')).toContain('application/json');
    expect(res.status).toBe(200);
  });

  test('/api/* always answers application/json', async () => {
    server = startTestServer();
    for (const path of ['/api/session', '/api/inbox/requests']) {
      const res = await fetch(`${server.baseUrl}${path}`);
      expect(res.headers.get('content-type')).toContain('application/json');
    }
  });

  test('crawler assets bypass the SPA', async () => {
    server = startTestServer();
    for (const path of ['/og.png', '/favicon.png']) {
      const res = await fetch(`${server.baseUrl}${path}`);
      expect(res.status).toBe(200);
      expect(res.headers.get('content-type')).toContain('image/png');
    }

    const robots = await fetch(`${server.baseUrl}/robots.txt`);
    expect(robots.headers.get('content-type')).toContain('text/plain');
    expect(await robots.text()).toContain('Disallow: /h/');
  });

  test('unmatched path returns the SPA', async () => {
    server = startTestServer();
    const res = await fetch(`${server.baseUrl}/dashboard`);
    expect(res.headers.get('content-type')).toContain('text/html');
    expect(await res.text()).toContain('spa');
  });
});

test('tests use in-memory database path', () => {
  expect(process.env.WEBHOOKY_DB_PATH).toBe(':memory:');
});

test('test run does not create data/webhooky.sqlite', () => {
  expect(existsSync('data/webhooky.sqlite')).toBe(false);
});
