import { ConnectionStatus } from '@/components/connection-status';
import { EmptyState } from '@/components/empty-state';
import { InboxActions } from '@/components/inbox-actions';
import { InboxHeader } from '@/components/inbox-header';
import { QuickStart } from '@/components/quick-start';
import { RequestDetail } from '@/components/request-detail';
import { RequestList } from '@/components/request-list';
import type { ConnectionState } from '@/hooks/use-requests';
import type { InboxDto, RequestDetailDto, RequestSummaryDto } from '@/types/api';

type AppShellProps = {
  inbox: InboxDto;
  requests: RequestSummaryDto[];
  connection: ConnectionState;
  newIds: Set<string>;
  selectedId: string | null;
  onSelectRequest: (id: string) => void;
  detail: RequestDetailDto | null;
  mobileDetail: boolean;
  onBackToList: () => void;
  onNewInbox: () => Promise<unknown>;
  onCleared: () => void;
  onDeleted: () => void;
};

export function AppShell({
  inbox,
  requests,
  connection,
  newIds,
  selectedId,
  onSelectRequest,
  detail,
  mobileDetail,
  onBackToList,
  onNewInbox,
  onCleared,
  onDeleted,
}: AppShellProps) {
  const requestCount = requests.length;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <InboxHeader
        inbox={{ ...inbox, requestCount }}
        actions={
          <InboxActions
            token={inbox.token}
            requestCount={requestCount}
            onNewInbox={onNewInbox}
            onCleared={onCleared}
            onDeleted={onDeleted}
          />
        }
      />

      <div className="request-workspace grid min-h-0 flex-1 md:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <section
          className={`bg-muted/20 flex min-h-0 flex-col border-b md:border-r md:border-b-0 ${mobileDetail ? 'hidden md:flex' : 'flex'}`}
          aria-label="Request list"
        >
          <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
            <h2 className="text-sm font-semibold">
              Request feed <span className="request-count">{requestCount}</span>
            </h2>
            <ConnectionStatus state={connection} />
          </div>
          <div className="min-h-0 flex-1 overflow-auto">
            {requests.length === 0 ? (
              <>
                <EmptyState />
                <div className="md:hidden">
                  <QuickStart webhookUrl={inbox.webhookUrl} />
                </div>
              </>
            ) : (
              <RequestList
                rows={requests}
                selectedId={selectedId}
                newIds={newIds}
                onSelect={onSelectRequest}
              />
            )}
          </div>
        </section>

        <section
          className={`bg-card flex min-h-0 flex-1 flex-col ${mobileDetail ? 'flex' : 'hidden md:flex'}`}
          aria-label="Request inspector"
        >
          {mobileDetail ? (
            <div className="border-b px-4 py-2 md:hidden">
              <button
                type="button"
                className="text-primary text-sm font-medium hover:underline"
                onClick={onBackToList}
              >
                ← Back to list
              </button>
            </div>
          ) : null}
          <RequestDetail
            detail={detail}
            webhookUrl={inbox.webhookUrl}
          />
        </section>
      </div>
    </div>
  );
}
