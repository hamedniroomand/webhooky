import { Radio } from 'lucide-react';

export function EmptyState() {
  return (
    <div className="feed-empty">
      <span className="empty-icon">
        <Radio size={22} />
      </span>
      <h3>Waiting for requests</h3>
      <p>
        Send a webhook to your endpoint.
        <br />
        New requests appear here automatically.
      </p>
      <span className="text-muted-foreground text-xs">GET · POST · PUT · PATCH · DELETE</span>
    </div>
  );
}
