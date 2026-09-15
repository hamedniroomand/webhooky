import { ArrowDownLeft, Terminal } from 'lucide-react';

import { CopyButton } from '@/components/copy-button';

export function QuickStart({ webhookUrl }: { webhookUrl: string }) {
  const sample = `curl -X POST '${webhookUrl}' \\\n  -H 'Content-Type: application/json' \\\n  -d '{"event":"hello","message":"It works!"}'`;
  return (
    <div className="quick-start">
      <span className="inspector-icon">
        <ArrowDownLeft
          size={30}
          strokeWidth={1.5}
        />
      </span>
      <p className="eyebrow">READY WHEN YOU ARE</p>
      <h2>
        Your next webhook,
        <br />
        without the guesswork.
      </h2>
      <p className="quick-description">
        Send a request, then select it in the feed to explore its headers, query parameters, and
        body.
      </p>
      <div className="sample-card">
        <div className="sample-header">
          <span>
            <Terminal size={14} /> Send your first request
          </span>
          <CopyButton
            value={sample}
            label="Copy command"
          />
        </div>
        <pre>{sample}</pre>
      </div>
      <div className="quick-steps">
        <span>
          <b>01</b> Copy your URL
        </span>
        <span>
          <b>02</b> Send a request
        </span>
        <span>
          <b>03</b> Inspect the details
        </span>
      </div>
    </div>
  );
}
