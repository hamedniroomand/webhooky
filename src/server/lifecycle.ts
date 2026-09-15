import { getStore } from '@/server/store-instance';
import type { Inbox, ManagementSession } from '@/server/types';

export function materializeInbox(inbox: Inbox | null): Inbox | null {
  if (!inbox) {
    return null;
  }
  if (inbox.status === 'deleted') {
    return inbox;
  }
  if (inbox.expiresAt.getTime() <= Date.now()) {
    getStore().db.run(`DELETE FROM inboxes WHERE id = ?`, [inbox.id]);
    return null;
  }
  return inbox;
}

export function resolveSessionInbox(sessionId: string): Inbox | null {
  return materializeInbox(getStore().getActiveInboxForSession(sessionId));
}

export function sweepExpired(): void {
  getStore().purgeExpired();
}

export function purgeSessionIfExpired(session: ManagementSession | null): ManagementSession | null {
  if (!session) {
    return null;
  }
  if (session.expiresAt.getTime() <= Date.now()) {
    getStore().db.run(`DELETE FROM management_sessions WHERE id = ?`, [session.id]);
    return null;
  }
  return session;
}
