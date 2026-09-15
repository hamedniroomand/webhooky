import { useEffect, useState } from 'react';

import { CopyButton } from '@/components/copy-button';
import { formatExpiryCountdown } from '@/lib/format';
import type { InboxDto } from '@/types/api';

type InboxHeaderProps = {
  inbox: InboxDto;
  actions: React.ReactNode;
};

export function InboxHeader({ inbox, actions }: InboxHeaderProps) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <header className="space-y-4 border-b px-4 py-5 md:px-6">
      <div className="space-y-2">
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          Webhook URL
        </p>
        <div className="bg-muted/40 ring-border/60 rounded-lg border p-3 ring-1">
          <p className="font-mono text-sm leading-relaxed break-all md:text-[0.95rem]">
            {inbox.webhookUrl}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <CopyButton
          value={inbox.webhookUrl}
          label="Copy webhook URL"
        />
        <div className="flex flex-wrap gap-2">{actions}</div>
      </div>

      <div className="text-muted-foreground flex flex-wrap gap-2 text-xs">
        <span className="bg-muted rounded-full px-2.5 py-1">
          {formatExpiryCountdown(new Date(inbox.expiresAt), now)}
        </span>
        <span className="bg-muted rounded-full px-2.5 py-1">{inbox.requestCount} requests</span>
        <span className="bg-muted rounded-full px-2.5 py-1">100 request limit</span>
      </div>

      <p className="text-muted-foreground text-xs leading-relaxed">
        Webhook payloads are temporarily stored and automatically deleted.
      </p>

      <details className="text-muted-foreground group text-xs">
        <summary className="cursor-pointer list-none font-medium [&::-webkit-details-marker]:hidden">
          <span className="group-open:hidden">Show browser session info</span>
          <span className="hidden group-open:inline">Hide browser session info</span>
        </summary>
        <div className="bg-muted/30 mt-2 space-y-2 rounded-md border p-3 leading-relaxed">
          <p>
            Your inbox is stored temporarily and linked to this browser. Refreshing the page will
            keep the same inbox. Clearing browser data may remove access.
          </p>
          <p>This inbox is associated with this browser and does not require an account.</p>
        </div>
      </details>
    </header>
  );
}
