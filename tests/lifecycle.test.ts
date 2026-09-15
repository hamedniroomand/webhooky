import { expect, test } from 'bun:test';

import { materializeInbox, sweepExpired } from '@/server/lifecycle';
import { getStore } from '@/server/store-instance';

test('expired inbox is removed on read', () => {
  const store = getStore();
  const session = store.createSession();
  const inbox = store.createInbox(session.id);
  store.setInboxExpiresAt(inbox.id, new Date(Date.now() - 1));
  const result = materializeInbox(store.getInboxById(inbox.id));
  expect(result).toBeNull();
  expect(store.getInboxById(inbox.id)).toBeNull();
});

test('sweep removes expired rows and keeps live inbox', () => {
  const store = getStore();
  const session = store.createSession();
  const live = store.createInbox(session.id);
  const expired = store.createInbox(session.id);
  store.setInboxExpiresAt(expired.id, new Date(Date.now() - 1));
  store.insertRequest(expired.id, {
    method: 'GET',
    path: '/',
    query: [],
    headers: [],
    contentType: null,
    body: null,
    bodySize: 0,
    oversized: false,
  });
  sweepExpired();
  expect(store.getInboxById(expired.id)).toBeNull();
  expect(store.getInboxById(live.id)).not.toBeNull();
});
