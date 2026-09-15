import { CopyButton } from '@/components/copy-button';

type KvTableProps = {
  rows: [string, string][];
  sensitive?: (name: string) => boolean;
};

export function KvTable({ rows, sensitive }: KvTableProps) {
  if (rows.length === 0) {
    return <p className="text-muted-foreground text-sm">None</p>;
  }

  const all = rows.map(([k, v]) => `${k}: ${v}`).join('\n');

  return (
    <div className="space-y-2">
      <CopyButton
        value={all}
        label="Copy all headers"
      />
      <div className="max-h-80 overflow-auto rounded-md border">
        <table className="w-full text-left text-sm">
          <tbody>
            {rows.map(([name, value], index) => (
              <tr
                key={`${name}-${index}`}
                className="border-b align-top"
              >
                <th className="text-muted-foreground w-1/3 px-3 py-2 font-medium">{name}</th>
                <td className="px-3 py-2 font-mono text-xs break-all">
                  <span className={sensitive?.(name) ? 'rounded bg-amber-500/10 px-1' : ''}>
                    {value}
                  </span>
                  <div className="mt-1">
                    <CopyButton
                      value={value}
                      label={`Copy ${name}`}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
