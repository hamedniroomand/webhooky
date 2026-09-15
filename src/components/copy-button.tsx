import { Check, Copy } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';

type CopyButtonProps = {
  value: string;
  label: string;
  confirmedLabel?: string;
  iconOnly?: boolean;
};

export function CopyButton({
  value,
  label,
  confirmedLabel = 'Copied',
  iconOnly = false,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const area = document.createElement('textarea');
      area.value = value;
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      document.body.removeChild(area);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  if (iconOnly) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="text-muted-foreground shrink-0"
        onClick={() => void copy()}
        aria-label={copied ? confirmedLabel : label}
        title={copied ? confirmedLabel : label}
      >
        {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => void copy()}
    >
      {copied ? confirmedLabel : label}
    </Button>
  );
}
