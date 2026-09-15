import { formatAbsoluteTime, formatBytes } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { RequestSummaryDto } from '@/types/api';

const methodClass: Record<string, string> = {
  GET: 'text-emerald-700',
  POST: 'text-sky-700',
  PUT: 'text-amber-700',
  PATCH: 'text-violet-700',
  DELETE: 'text-rose-700',
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
              'hover:bg-muted/50 w-full px-3 py-2 text-left transition-colors',
              selectedId === row.id && 'bg-muted',
              newIds.has(row.id) && 'bg-primary/10 ring-1 ring-primary/30',
            )}
            onClick={() => onSelect(row.id)}
          >
            <div className="flex items-center gap-2 text-sm">
              <span className={cn('font-semibold', methodClass[row.method] ?? 'text-foreground')}>
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
