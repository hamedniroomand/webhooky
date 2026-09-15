import { ArrowUpRight } from 'lucide-react';
import type { ReactNode } from 'react';

import { ThemeToggle } from '@/components/theme-toggle';
import type { Theme } from '@/hooks/use-theme';

import favicon from '../favicon.png';

type AppLayoutProps = { theme: Theme; onToggleTheme: () => void; children: ReactNode };

export function AppLayout({ theme, onToggleTheme, children }: AppLayoutProps) {
  return (
    <div className="app-frame">
      <header className="app-nav">
        <a
          href="/"
          className="brand"
          aria-label="Webhooky home"
        >
          <span className="brand-mark">
            <img
              src={favicon}
              alt=""
              width={35}
              height={35}
              className="rounded-lg"
            />
          </span>
          <span>
            webhooky<span className="text-primary">.</span>
          </span>
        </a>
        <span className="nav-divider" />
        <span className="text-muted-foreground text-sm">Request workspace</span>
        <div className="ml-auto flex items-center gap-4">
          <a
            href="#endpoint"
            className="guide-link"
          >
            Quick start <ArrowUpRight size={14} />
          </a>
          <ThemeToggle
            theme={theme}
            onToggle={onToggleTheme}
          />
        </div>
      </header>
      <div className="workspace">{children}</div>
      <footer className="app-footer">
        <a
          href="https://github.com/hamedniroomand/webhooky"
          target="_blank"
          rel="noopener noreferrer"
          className="guide-link hover:text-foreground"
        >
          View on GitHub{' '}
          <ArrowUpRight
            size={14}
            aria-hidden="true"
          />
        </a>
        <span>Temporary inboxes · No account required</span>
      </footer>
    </div>
  );
}
