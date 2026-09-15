import type { ConnectionState } from '@/hooks/use-requests';

const labels: Record<ConnectionState, string> = {
  connected: 'Connected',
  reconnecting: 'Reconnecting…',
  offline: 'Offline',
};

export function ConnectionStatus({ state }: { state: ConnectionState }) {
  return (
    <p
      className="text-muted-foreground text-xs"
      aria-live="polite"
    >
      Stream: {labels[state]}
    </p>
  );
}
