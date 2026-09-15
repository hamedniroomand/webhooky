import { useEffect, useRef, useState, type KeyboardEvent } from 'react';

import { BodyView } from '@/components/body-view';
import { CopyButton } from '@/components/copy-button';
import { KvTable } from '@/components/kv-table';
import { QuickStart } from '@/components/quick-start';
import { formatAbsoluteTime, formatBytes } from '@/lib/format';
import { formatRawRequest } from '@/lib/raw';
import { cn } from '@/lib/utils';
import type { RequestDetailDto } from '@/types/api';

const tabs = ['Overview', 'Headers', 'Query', 'Body', 'Raw'] as const;
type Tab = (typeof tabs)[number];

type RequestDetailProps = {
  detail: RequestDetailDto | null;
  webhookUrl: string;
};

export function RequestDetail({ detail, webhookUrl }: RequestDetailProps) {
  const [tab, setTab] = useState<Tab>('Overview');
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    setTab('Overview');
  }, [detail?.id]);

  if (!detail) {
    return <QuickStart webhookUrl={webhookUrl} />;
  }

  const fullUrl = new URL(
    `${webhookUrl.replace(/\/$/, '')}${detail.path === '/' ? '' : detail.path}`,
  );
  for (const [key, value] of detail.query) {
    fullUrl.searchParams.append(key, value);
  }

  function onTabKeyDown(event: KeyboardEvent, index: number) {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') {
      return;
    }
    event.preventDefault();
    const next =
      event.key === 'ArrowRight'
        ? (index + 1) % tabs.length
        : (index - 1 + tabs.length) % tabs.length;
    tabRefs.current[next]?.focus();
    setTab(tabs[next] ?? 'Overview');
  }

  const raw = formatRawRequest(detail, webhookUrl);

  return (
    <div className="request-detail flex h-full min-h-0 flex-col">
      <div className="detail-heading">
        <div>
          <p className="eyebrow">REQUEST INSPECTOR</p>
          <h2>
            <span className="method-badge">{detail.method}</span>{' '}
            <span className="break-all">{detail.path}</span>
          </h2>
        </div>
        <CopyButton
          value={fullUrl.toString()}
          label="Copy URL"
        />
      </div>
      <div
        role="tablist"
        aria-label="Request inspector sections"
        className="bg-muted/20 flex flex-wrap gap-1 border-b p-2 md:px-4"
      >
        {tabs.map((label, index) => (
          <button
            key={label}
            ref={(el) => {
              tabRefs.current[index] = el;
            }}
            type="button"
            role="tab"
            aria-selected={tab === label}
            tabIndex={tab === label ? 0 : -1}
            className={cn(
              'focus-visible:ring-ring rounded-md px-3 py-1.5 text-sm focus-visible:ring-2',
              tab === label ? 'bg-muted font-medium' : 'text-muted-foreground',
            )}
            onClick={() => setTab(label)}
            onKeyDown={(event) => onTabKeyDown(event, index)}
          >
            {label}
          </button>
        ))}
      </div>

      <div
        className="min-h-0 flex-1 overflow-auto p-4 text-sm"
        role="tabpanel"
      >
        {tab === 'Overview' ? (
          <dl className="overview-grid">
            <div>
              <dt className="text-muted-foreground">Method</dt>
              <dd>{detail.method}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">URL</dt>
              <dd className="font-mono text-xs break-all">{fullUrl.toString()}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Path</dt>
              <dd className="font-mono text-xs">{detail.path}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Received</dt>
              <dd>{formatAbsoluteTime(new Date(detail.receivedAt))}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Content type</dt>
              <dd>{detail.contentType ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Size</dt>
              <dd>{formatBytes(detail.bodySize)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Request ID</dt>
              <dd className="font-mono text-xs">{detail.id}</dd>
            </div>
          </dl>
        ) : null}

        {tab === 'Headers' ? (
          <KvTable
            rows={detail.headers}
            copyAllLabel="Copy all headers"
            sensitive={(name) => /authorization|secret|token|signature|cookie/i.test(name)}
          />
        ) : null}

        {tab === 'Query' ? (
          <KvTable
            rows={detail.query}
            copyAllLabel="Copy all query params"
          />
        ) : null}

        {tab === 'Body' ? (
          <BodyView
            body={detail.body}
            contentType={detail.contentType}
          />
        ) : null}

        {tab === 'Raw' ? (
          <div className="space-y-2">
            <CopyButton
              value={raw}
              label="Copy raw request"
            />
            <pre className="max-h-96 overflow-auto rounded-md border p-3 font-mono text-xs break-all whitespace-pre-wrap">
              {raw}
            </pre>
          </div>
        ) : null}
      </div>
    </div>
  );
}
