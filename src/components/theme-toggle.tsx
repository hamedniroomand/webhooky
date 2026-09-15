import { Moon, Sun } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { Theme } from '@/hooks/use-theme';

type ThemeToggleProps = {
  theme: Theme;
  onToggle: () => void;
};

export function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  const next = theme === 'dark' ? 'light' : 'dark';

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onToggle}
      aria-label={`Switch to ${next} mode`}
    >
      {theme === 'dark' ? <Sun aria-hidden /> : <Moon aria-hidden />}
      <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
    </Button>
  );
}
