import { Button } from '@/components/ui/button';

type InboxStateProps = {
  kind: 'expired' | 'deleted' | 'missing' | 'lost-session';
  onCreate: () => void;
};

const copy = {
  expired: 'This webhook inbox has expired.',
  deleted: 'This webhook inbox is no longer available.',
  missing: 'This webhook inbox does not exist.',
  'lost-session':
    'Your inbox is stored temporarily and linked to this browser. Refreshing the page will keep the same inbox. Clearing browser data may remove access.',
} as const;

export function InboxState({ kind, onCreate }: InboxStateProps) {
  return (
    <div className="bg-card space-y-4 rounded-xl border p-6 text-center shadow-sm">
      <p>{copy[kind]}</p>
      {kind === 'lost-session' ? (
        <p className="text-muted-foreground text-sm">
          This inbox is associated with this browser and does not require an account.
        </p>
      ) : null}
      <Button
        type="button"
        onClick={onCreate}
      >
        Create New Inbox
      </Button>
    </div>
  );
}
