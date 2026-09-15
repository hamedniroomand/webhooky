import { materializeInbox } from '@/server/lifecycle';
import { getStore } from '@/server/store-instance';
import type { Inbox, ManagementSession } from '@/server/types';

export type AuthFailure =
  | 'NO_SESSION'
  | 'NOT_OWNER'
  | 'INBOX_NOT_FOUND'
  | 'INBOX_EXPIRED'
  | 'INBOX_DELETED';

export function inboxAuthFailure(inbox: Inbox | null): AuthFailure {
  if (!inbox) {
    return 'INBOX_NOT_FOUND';
  }
  if (inbox.status === 'deleted') {
    return 'INBOX_DELETED';
  }
  if (inbox.status === 'expired' || inbox.expiresAt.getTime() <= Date.now()) {
    return 'INBOX_EXPIRED';
  }
  return 'INBOX_NOT_FOUND';
}

export function authorizeInbox(
  session: ManagementSession | null,
  inbox: Inbox | null,
): { ok: true; inbox: Inbox } | { ok: false; reason: AuthFailure } {
  if (!session) {
    return { ok: false, reason: 'NO_SESSION' };
  }
  if (!inbox) {
    return { ok: false, reason: 'INBOX_NOT_FOUND' };
  }
  if (inbox.sessionId !== session.id) {
    return { ok: false, reason: 'NOT_OWNER' };
  }
  if (inbox.status === 'deleted') {
    return { ok: false, reason: 'INBOX_DELETED' };
  }
  if (inbox.status === 'expired' || inbox.expiresAt.getTime() <= Date.now()) {
    return { ok: false, reason: 'INBOX_EXPIRED' };
  }
  return { ok: true, inbox };
}

export function lookupInboxByToken(token: string): Inbox | null {
  const inbox = getStore().getInboxByToken(token);
  if (!inbox) {
    return null;
  }
  if (inbox.status === 'deleted') {
    return inbox;
  }
  return materializeInbox(inbox);
}
