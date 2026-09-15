import { afterEach, expect, test } from 'bun:test';

import { publishNewRequest, resetEventHub, subscribe } from '@/server/events';

import { startTestServer, type TestServer } from './helpers';

let server: TestServer | undefined;

afterEach(() => {
  server?.stop();
  server = undefined;
  resetEventHub();
});

test('publish delivers summary without body field', async () => {
  const inboxId = 'inbox-a';
  const seen: unknown[] = [];
  subscribe(inboxId, (_event, data) => {
    seen.push(data);
  });
  publishNewRequest(inboxId, {
    id: '1',
    method: 'POST',
    path: '/',
    receivedAt: new Date().toISOString(),
    contentType: 'application/json',
    bodySize: 10,
    oversized: false,
  });
  expect(seen).toHaveLength(1);
  expect(seen[0]).not.toHaveProperty('body');
});

test('SSE stream emits ready and request events', async () => {
  server = startTestServer();
  const sessionRes = await fetch(`${server.baseUrl}/api/session`);
  const cookie = sessionRes.headers.get('set-cookie')?.split(';')[0] ?? '';
  const createRes = await fetch(`${server.baseUrl}/api/inbox`, {
    method: 'POST',
    headers: { cookie },
  });
  const inbox = (await createRes.json()) as { token: string };

  const res = await fetch(`${server.baseUrl}/api/inbox/${encodeURIComponent(inbox.token)}/events`, {
    headers: { cookie },
  });
  expect(res.headers.get('content-type')).toContain('text/event-stream');

  const reader = res.body?.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  const first = await reader?.read();
  buffer += decoder.decode(first?.value ?? new Uint8Array(), { stream: true });
  expect(buffer).toContain('event: ready');

  await fetch(`${server.baseUrl}/h/${inbox.token}`, {
    method: 'POST',
    body: '{"ok":true}',
  });

  for (let i = 0; i < 20; i++) {
    const chunk = await reader?.read();
    buffer += decoder.decode(chunk?.value ?? new Uint8Array(), { stream: true });
    if (buffer.includes('event: request')) {
      break;
    }
    await Bun.sleep(50);
  }
  expect(buffer).toContain('event: request');
  void reader?.cancel();
});
