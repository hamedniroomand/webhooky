import { CopyButton } from '@/components/copy-button';

type EmptyStateProps = {
  webhookUrl: string;
};

export function EmptyState({ webhookUrl }: EmptyStateProps) {
  const sample = `curl -X POST '${webhookUrl}' -H 'Content-Type: application/json' -d '{"hello":"world"}'`;

  return (
    <div className="text-muted-foreground space-y-3 p-6 text-sm md:p-8">
      <p>No requests yet.</p>
      <p>Send a request to your webhook URL and it will appear here.</p>
      <div className="bg-muted/40 rounded-md border p-3 font-mono text-xs break-all">{sample}</div>
      <CopyButton
        value={sample}
        label="Copy sample command"
      />
    </div>
  );
}
