import { useState } from 'react';

import { ConfirmDialog } from '@/components/confirm-dialog';
import { Button } from '@/components/ui/button';
import { clearRequests, deleteInbox } from '@/lib/api';

type InboxActionsProps = {
  token: string;
  requestCount: number;
  onNewInbox: () => Promise<unknown>;
  onCleared: () => void;
  onDeleted: () => void;
};

export function InboxActions({
  token,
  requestCount,
  onNewInbox,
  onCleared,
  onDeleted,
}: InboxActionsProps) {
  const [clearOpen, setClearOpen] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={requestCount === 0}
        onClick={() => setClearOpen(true)}
      >
        Clear Requests
      </Button>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => setNewOpen(true)}
      >
        New Inbox
      </Button>
      <Button
        type="button"
        variant="destructive"
        size="sm"
        onClick={() => setDeleteOpen(true)}
      >
        Delete Inbox
      </Button>

      <ConfirmDialog
        open={clearOpen}
        title="Clear requests"
        message={`Delete all ${requestCount} captured request${requestCount === 1 ? '' : 's'} from this inbox? This cannot be undone.`}
        confirmLabel="Clear Requests"
        onCancel={() => setClearOpen(false)}
        onConfirm={() => {
          void clearRequests(token).then(() => {
            onCleared();
            setClearOpen(false);
          });
        }}
      />

      <ConfirmDialog
        open={newOpen}
        title="Create new inbox"
        message="Create a new webhook inbox? Your current inbox stays active until it expires."
        confirmLabel="New Inbox"
        onCancel={() => setNewOpen(false)}
        onConfirm={() => {
          void onNewInbox().finally(() => setNewOpen(false));
        }}
      />

      <ConfirmDialog
        open={deleteOpen}
        title="Delete inbox"
        message="Delete this inbox and all captured requests? The webhook URL will stop working."
        confirmLabel="Delete Inbox"
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => {
          void deleteInbox(token).then(() => {
            onDeleted();
            setDeleteOpen(false);
          });
        }}
      />
    </>
  );
}
