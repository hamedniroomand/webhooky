import { Clock3, Link2, ShieldCheck } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';

import { CopyButton } from '@/components/copy-button';
import { formatExpiryCountdown } from '@/lib/format';
import type { InboxDto } from '@/types/api';

type InboxHeaderProps = { inbox: InboxDto; actions: ReactNode };

export function InboxHeader({ inbox, actions }: InboxHeaderProps) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  return (
    <header className="inbox-header">
      <div className="workspace-heading">
        <div>
          <p className="eyebrow">DEVELOPER TOOLS / WEBHOOK INSPECTOR</p>
          <h1>Every request. In detail.</h1>
          <p className="text-muted-foreground text-sm">
            Capture incoming webhooks and see exactly what arrived.
          </p>
        </div>
        <span className="session-badge">
          <ShieldCheck size={15} /> Browser session
        </span>
      </div>
      <div
        className="endpoint-card"
        id="endpoint"
      >
        <div className="endpoint-label">
          <span className="eyebrow">YOUR WEBHOOK ENDPOINT</span>
          <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <Clock3 size={13} />
            {formatExpiryCountdown(new Date(inbox.expiresAt), now)}
          </span>
        </div>
        <div className="endpoint-url">
          <Link2
            size={18}
            className="text-primary shrink-0"
          />
          <code>{inbox.webhookUrl}</code>
          <CopyButton
            value={inbox.webhookUrl}
            label="Copy URL"
          />
        </div>
        <div className="endpoint-bottom">
          <p>Send a request to this URL. It will appear below in real time.</p>
          <span>{inbox.requestCount} / 100 requests</span>
        </div>
      </div>
      <div className="inbox-toolbar">
        <p>
          <span className="text-primary">↳</span> This inbox belongs to your browser. Payloads
          expire after 24 hours.
        </p>
        <div className="flex flex-wrap gap-2">{actions}</div>
      </div>
    </header>
  );
}
