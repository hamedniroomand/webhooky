import { CopyButton } from '@/components/copy-button';

type KvTableProps = {
  rows: [string, string][];
  sensitive?: (name: string) => boolean;
  copyAllLabel?: string;
};

export function KvTable({ rows, sensitive, copyAllLabel = 'Copy all' }: KvTableProps) {
  if (rows.length === 0) {
    return <p className="text-muted-foreground text-sm">None</p>;
  }

  const all = rows.map(([k, v]) => `${k}: ${v}`).join('\n');

  return (
    <div className="space-y-2">
      <CopyButton
        value={all}
        label={copyAllLabel}
      />
      <div className="max-h-80 overflow-auto rounded-md border">
        <table className="w-full text-left text-sm">
          <tbody>
            {rows.map(([name, value], index) => (
              <tr
                key={`${name}-${index}`}
                className="border-b align-top last:border-b-0"
              >
                <th className="text-muted-foreground w-[30%] max-w-[12rem] px-3 py-2 font-medium break-all">
                  {name}
                </th>
                <td className="px-3 py-2 font-mono text-xs break-all">
                  <span className={sensitive?.(name) ? 'rounded bg-amber-500/10 px-1' : ''}>
                    {value}
                  </span>
                </td>
                <td className="w-10 px-1 py-1.5 align-top">
                  <CopyButton
                    iconOnly
                    value={value}
                    label={`Copy ${name}`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
