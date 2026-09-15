import { useCallback, useEffect, useState, type ReactNode } from 'react';

import { AppLayout } from '@/components/app-layout';
import { AppShell } from '@/components/app-shell';
import { InboxState } from '@/components/inbox-state';
import { useRequests } from '@/hooks/use-requests';
import { useSession } from '@/hooks/use-session';
import { useTheme } from '@/hooks/use-theme';

import './index.css';

export function App() {
  const { theme, toggle } = useTheme();
  const session = useSession();
  const inboxToken = session.inbox?.token ?? null;
  const requests = useRequests(inboxToken);
  const [mobileDetail, setMobileDetail] = useState(false);

  useEffect(() => {
    setMobileDetail(false);
  }, [inboxToken]);

  useEffect(() => {
    const inbox = session.inbox;
    if (!inbox) {
      return;
    }
    const count = requests.requests.length;
    if (inbox.requestCount !== count) {
      session.adoptInbox({ ...inbox, requestCount: count });
    }
  }, [session.inbox, session.adoptInbox, requests.requests.length]);

  const selectRequest = useCallback(
    (id: string) => {
      requests.setSelectedId(id);
      if (window.matchMedia('(max-width: 767px)').matches) {
        setMobileDetail(true);
        history.pushState({ pane: 'detail' }, '', '/');
      }
    },
    [requests],
  );

  useEffect(() => {
    const onPop = () => {
      setMobileDetail(false);
      requests.setSelectedId(null);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [requests]);

  let content: ReactNode;

  if (session.phase === 'loading') {
    content = (
      <main className="text-muted-foreground flex flex-1 items-center justify-center p-8 text-sm">
        Loading inbox…
      </main>
    );
  } else if (session.phase === 'error') {
    content = (
      <main className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-lg">
          <InboxState
            kind={session.lostSession ? 'lost-session' : 'missing'}
            onCreate={() => void session.createNewInbox()}
          />
        </div>
      </main>
    );
  } else if (!session.inbox) {
    const kind =
      session.absentReason === 'expired'
        ? 'expired'
        : session.absentReason === 'deleted'
          ? 'deleted'
          : 'missing';
    content = (
      <main className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-lg">
          <InboxState
            kind={kind}
            onCreate={() => void session.createNewInbox()}
          />
        </div>
      </main>
    );
  } else {
    content = (
      <AppShell
        inbox={session.inbox}
        requests={requests.requests}
        connection={requests.connection}
        newIds={requests.newIds}
        selectedId={requests.selectedId}
        onSelectRequest={selectRequest}
        detail={requests.detail}
        mobileDetail={mobileDetail}
        onBackToList={() => {
          setMobileDetail(false);
          requests.setSelectedId(null);
        }}
        onNewInbox={session.createNewInbox}
        onCleared={requests.clearList}
        onDeleted={() => void session.refresh()}
      />
    );
  }

  return (
    <AppLayout
      theme={theme}
      onToggleTheme={toggle}
    >
      {content}
    </AppLayout>
  );
}

export default App;
