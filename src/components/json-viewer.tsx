import { useState } from 'react';

const PREVIEW_CHARS = 200_000;

type JsonViewerProps = {
  value: unknown;
};

function JsonNode({ value, name }: { value: unknown; name?: string }) {
  const [open, setOpen] = useState(true);

  if (value === null || typeof value !== 'object') {
    return (
      <div className="font-mono text-xs break-all">
        {name ? (
          <>
            <span className="text-sky-700 dark:text-sky-300">{name}</span>
            <span className="text-muted-foreground">: </span>
          </>
        ) : null}
        <span className="text-emerald-700 dark:text-emerald-300">{JSON.stringify(value)}</span>
      </div>
    );
  }

  if (Array.isArray(value)) {
    return (
      <div className="font-mono text-xs">
        <button
          type="button"
          className="text-left hover:underline"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          {name ? `${name}: ` : ''}[{value.length}]
        </button>
        {open ? (
          <div className="border-muted ml-4 border-l pl-2">
            {value.map((item, index) => (
              <JsonNode
                key={index}
                name={String(index)}
                value={item}
              />
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  const entries = Object.entries(value as Record<string, unknown>);
  return (
    <div className="font-mono text-xs">
      <button
        type="button"
        className="text-left hover:underline"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        {name ? `${name}: ` : ''}
        {'{'}
        {entries.length}
        {'}'}
      </button>
      {open ? (
        <div className="border-muted ml-4 border-l pl-2">
          {entries.map(([key, child]) => (
            <JsonNode
              key={key}
              name={key}
              value={child}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function JsonViewer({ value }: JsonViewerProps) {
  const raw = JSON.stringify(value, null, 2);
  if (raw.length > PREVIEW_CHARS) {
    return (
      <div className="space-y-2">
        <p className="text-muted-foreground text-xs">
          Large JSON preview truncated in the UI. Copy still uses the full body.
        </p>
        <pre className="max-h-96 overflow-auto rounded-md border p-3 font-mono text-xs break-all">
          {raw.slice(0, PREVIEW_CHARS)}…
        </pre>
      </div>
    );
  }

  return (
    <div className="max-h-96 overflow-auto rounded-md border p-3">
      <JsonNode value={value} />
    </div>
  );
}
