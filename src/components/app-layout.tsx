import type { ReactNode } from 'react';

import { ThemeToggle } from '@/components/theme-toggle';
import type { Theme } from '@/hooks/use-theme';

type AppLayoutProps = {
  theme: Theme;
  onToggleTheme: () => void;
  children: ReactNode;
};

export function AppLayout({ theme, onToggleTheme, children }: AppLayoutProps) {
  return (
    <div className="bg-muted/30 min-h-svh md:p-4">
      <div className="bg-card mx-auto flex min-h-svh w-full max-w-6xl flex-col overflow-hidden md:min-h-[calc(100svh-2rem)] md:rounded-xl md:border md:shadow-lg">
        <div className="bg-card/80 supports-[backdrop-filter]:bg-card/70 sticky top-0 z-10 flex items-center justify-between gap-3 border-b px-4 py-3 backdrop-blur">
          <div>
            <p className="text-sm font-semibold tracking-tight">Webhooky</p>
            <p className="text-muted-foreground text-xs">Temporary webhook inspector</p>
          </div>
          <ThemeToggle
            theme={theme}
            onToggle={onToggleTheme}
          />
        </div>
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </div>
    </div>
  );
}
