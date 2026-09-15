import { useState } from 'react';

import { Button } from '@/components/ui/button';

type CopyButtonProps = {
  value: string;
  label: string;
  confirmedLabel?: string;
};

export function CopyButton({ value, label, confirmedLabel = 'Copied' }: CopyButtonProps) {
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
