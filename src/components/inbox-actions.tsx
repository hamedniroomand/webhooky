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
        Clear requests
      </Button>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => setNewOpen(true)}
      >
        New inbox
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setDeleteOpen(true)}
      >
        Delete inbox
      </Button>

      <ConfirmDialog
        open={clearOpen}
        title="Clear requests"
        message={`Delete all ${requestCount} captured request${requestCount === 1 ? '' : 's'} from this inbox? This cannot be undone.`}
        confirmLabel="Clear requests"
        onCancel={() => setClearOpen(false)}
        onConfirm={() => {
          return clearRequests(token).then(() => {
            onCleared();
            setClearOpen(false);
          });
        }}
      />

      <ConfirmDialog
        open={newOpen}
        title="Create new inbox"
        message="Create a new webhook inbox? Your current inbox stays active until it expires."
        confirmLabel="New inbox"
        onCancel={() => setNewOpen(false)}
        onConfirm={() => {
          return onNewInbox().then(() => setNewOpen(false));
        }}
      />

      <ConfirmDialog
        open={deleteOpen}
        title="Delete inbox"
        message="Delete this inbox and all captured requests? The webhook URL will stop working."
        confirmLabel="Delete inbox"
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => {
          return deleteInbox(token).then(() => {
            onDeleted();
            setDeleteOpen(false);
          });
        }}
      />
    </>
  );
}
