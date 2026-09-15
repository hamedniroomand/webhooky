import { JsonViewer } from '@/components/json-viewer';
import { KvTable } from '@/components/kv-table';
import { detectBody } from '@/lib/body';

type BodyViewProps = {
  body: string | null;
  contentType: string | null;
};

export function BodyView({ body, contentType }: BodyViewProps) {
  if (body == null) {
    return <p className="text-muted-foreground text-sm">No body stored for this request.</p>;
  }

  const detected = detectBody(body, contentType);

  if (detected.kind === 'json') {
    return <JsonViewer value={detected.value} />;
  }

  if (detected.kind === 'form') {
    return <KvTable rows={detected.pairs} />;
  }

  return (
    <div className="space-y-2">
      {detected.parseError ? <p className="text-sm text-amber-700">{detected.parseError}</p> : null}
      <pre className="max-h-96 overflow-auto rounded-md border p-3 font-mono text-xs break-all whitespace-pre-wrap">
        {detected.text}
      </pre>
    </div>
  );
}
