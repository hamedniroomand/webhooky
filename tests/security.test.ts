import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';

import { Glob } from 'bun';

import { generateSessionSecret, generateWebhookToken } from '@/server/ids';

import { startTestServer } from './helpers';

function readSrc(path: string): string {
  return readFileSync(path, 'utf8');
}

describe('security', () => {
  test('token generators are independent and high entropy', () => {
    const token = generateWebhookToken();
    const secret = generateSessionSecret();
    expect(token).not.toBe(secret);
    expect(token.length).toBeGreaterThan(16);
    expect(secret.length).toBeGreaterThan(16);
  });

  test('§61 public token cannot access management API', async () => {
    const server = startTestServer();
    const { getStore } = await import('@/server/store-instance');
    const inbox = getStore().createInbox(getStore().createSession().id);
    const res = await fetch(
      `${server.baseUrl}/api/inbox/${encodeURIComponent(inbox.publicToken)}/requests`,
    );
    expect(res.status).toBe(401);
    server.stop();
  });

  test('management responses use no-store', async () => {
    const server = startTestServer();
    const res = await fetch(`${server.baseUrl}/api/session`);
    expect(res.headers.get('cache-control')).toBe('no-store');
    server.stop();
  });

  test('no inbox listing endpoint exists', async () => {
    const server = startTestServer();
    const res = await fetch(`${server.baseUrl}/api/inboxes`);
    expect(res.status).not.toBe(200);
    server.stop();
  });

  test('path traversal token segment returns inbox not found JSON', async () => {
    const server = startTestServer();
    const res = await fetch(`${server.baseUrl}/h/..%2F..%2Fetc/passwd`, {
      method: 'POST',
    });
    expect(res.headers.get('content-type')).toContain('application/json');
    server.stop();
  });

  test('client code does not import server runtime modules', async () => {
    const glob = new Glob('src/{components,hooks,lib}/**/*.{ts,tsx}');
    for (const path of glob.scanSync('.')) {
      const source = readSrc(path);
      expect(source.includes('from "@/server/')).toBe(false);
      expect(source.includes("from '@/server/")).toBe(false);
      expect(source.includes('bun:sqlite')).toBe(false);
    }
  });

  test('src has no dangerouslySetInnerHTML or innerHTML assignments', () => {
    const glob = new Glob('src/**/*.{ts,tsx}');
    for (const path of glob.scanSync('.')) {
      const source = readSrc(path);
      expect(source.includes('dangerouslySetInnerHTML')).toBe(false);
      expect(/\binnerHTML\s*=/.test(source)).toBe(false);
      expect(source.includes('new Function(')).toBe(false);
      expect(/\beval\s*\(/.test(source)).toBe(false);
    }
  });
});
