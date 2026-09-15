import { useCallback, useEffect, useState } from 'react';

import { ApiClientError, createInbox, getSession } from '@/lib/api';
import type { InboxDto, SessionBootstrapDto } from '@/types/api';

export type SessionPhase = 'loading' | 'ready' | 'error';

export type SessionState = {
  phase: SessionPhase;
  inbox: InboxDto | null;
  absentReason: SessionBootstrapDto['inboxAbsentReason'];
  error: string | null;
  lostSession: boolean;
  refresh: () => Promise<void>;
  adoptInbox: (inbox: InboxDto) => void;
  createNewInbox: () => Promise<InboxDto>;
};

export function useSession(): SessionState {
  const [phase, setPhase] = useState<SessionPhase>('loading');
  const [inbox, setInbox] = useState<InboxDto | null>(null);
  const [absentReason, setAbsentReason] = useState<SessionBootstrapDto['inboxAbsentReason']>(null);
  const [error, setError] = useState<string | null>(null);
  const [lostSession, setLostSession] = useState(false);

  const bootstrap = useCallback(async () => {
    setPhase('loading');
    setError(null);
    try {
      let data = await getSession();
      if (!data.inbox && data.inboxAbsentReason === 'none') {
        const created = await createInbox();
        data = { inbox: created, inboxAbsentReason: null };
      }
      setInbox(data.inbox);
      setAbsentReason(data.inboxAbsentReason);
      setLostSession(false);
      setPhase('ready');
    } catch (e) {
      if (e instanceof ApiClientError && e.code === 'NO_SESSION') {
        setLostSession(true);
      }
      setError(e instanceof Error ? e.message : 'Failed to load session.');
      setPhase('error');
    }
  }, []);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  const createNewInbox = useCallback(async () => {
    const created = await createInbox();
    setInbox(created);
    setAbsentReason(null);
    setPhase('ready');
    return created;
  }, []);

  return {
    phase,
    inbox,
    absentReason,
    error,
    lostSession,
    refresh: bootstrap,
    adoptInbox: setInbox,
    createNewInbox,
  };
}
