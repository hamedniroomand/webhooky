import { formatAbsoluteTime, formatBytes } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { RequestSummaryDto } from '@/types/api';

const methodClass: Record<string, string> = {
  GET: 'text-emerald-700 dark:text-emerald-400',
  POST: 'text-sky-700 dark:text-sky-400',
  PUT: 'text-amber-700 dark:text-amber-400',
  PATCH: 'text-violet-700 dark:text-violet-400',
  DELETE: 'text-rose-700 dark:text-rose-400',
};

type RequestListProps = {
  rows: RequestSummaryDto[];
  selectedId: string | null;
  newIds: Set<string>;
  onSelect: (id: string) => void;
};

export function RequestList({ rows, selectedId, newIds, onSelect }: RequestListProps) {
  return (
    <ul
      className="divide-y overflow-auto"
      aria-label="Captured requests"
    >
      {rows.map((row) => (
        <li key={row.id}>
          <button
            type="button"
            className={cn(
              'request-row hover:bg-muted/50 w-full px-4 py-4 text-left transition-colors',
              selectedId === row.id && 'selected',
              newIds.has(row.id) && 'bg-primary/10 ring-1 ring-primary/30',
            )}
            aria-pressed={selectedId === row.id}
            onClick={() => onSelect(row.id)}
          >
            <div className="flex items-center gap-2 text-sm">
              <span className={cn('method-badge', methodClass[row.method] ?? 'text-foreground')}>
                {row.method}
              </span>
              <span className="truncate font-mono text-xs">{row.path}</span>
            </div>
            <div className="text-muted-foreground mt-1 flex flex-wrap gap-2 text-xs">
              <span>{formatAbsoluteTime(new Date(row.receivedAt))}</span>
              <span>{formatBytes(row.bodySize)}</span>
              {row.contentType ? (
                <span className="max-w-[10rem] truncate">{row.contentType}</span>
              ) : null}
              {row.oversized ? <span>Oversized</span> : null}
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}
