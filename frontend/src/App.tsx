import { useState, Suspense, lazy, useCallback, useRef, forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Lazy load heavy components for better initial load performance
const Explorer = lazy(() =>
  import('./components/explorer').then((m) => ({ default: m.Explorer }))
);
const Commands = lazy(() =>
  import('./components/commands').then((m) => ({ default: m.Commands }))
);

type Tab = 'explorer' | 'commands';

function cn(...inputs: (string | undefined | null | boolean)[]) {
  return twMerge(clsx(inputs));
}

function LoadingFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        <span className="text-sm text-text-secondary">Loading...</span>
      </div>
    </div>
  );
}

const TABS: Tab[] = ['explorer', 'commands'];

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('explorer');
  const tabRefs = useRef<Map<Tab, HTMLButtonElement | null>>(new Map());

  // WAI-ARIA keyboard navigation for tabs
  const handleTabKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const currentIndex = TABS.indexOf(activeTab);
      let newIndex: number | null = null;

      switch (e.key) {
        case 'ArrowLeft':
          newIndex = currentIndex > 0 ? currentIndex - 1 : TABS.length - 1;
          break;
        case 'ArrowRight':
          newIndex = currentIndex < TABS.length - 1 ? currentIndex + 1 : 0;
          break;
        case 'Home':
          newIndex = 0;
          break;
        case 'End':
          newIndex = TABS.length - 1;
          break;
      }

      if (newIndex !== null) {
        e.preventDefault();
        const newTab = TABS[newIndex];
        setActiveTab(newTab);
        tabRefs.current.get(newTab)?.focus();
      }
    },
    [activeTab]
  );

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden">
      {/* Header with tabs */}
      <header className="flex h-12 shrink-0 items-center border-b border-border bg-surface px-4">
        <nav className="flex gap-1" role="tablist" aria-label="Main navigation">
          <TabButton
            id="explorer-tab"
            ref={(el) => tabRefs.current.set('explorer', el)}
            active={activeTab === 'explorer'}
            onClick={() => setActiveTab('explorer')}
            aria-controls="explorer-panel"
            onKeyDown={handleTabKeyDown}
          >
            Explorer
          </TabButton>
          <TabButton
            id="commands-tab"
            ref={(el) => tabRefs.current.set('commands', el)}
            active={activeTab === 'commands'}
            onClick={() => setActiveTab('commands')}
            aria-controls="commands-panel"
            onKeyDown={handleTabKeyDown}
          >
            Commands
          </TabButton>
        </nav>
      </header>

      {/* Main content area with Suspense for lazy loading */}
      <main className="flex flex-1 overflow-hidden">
        <Suspense fallback={<LoadingFallback />}>
          {activeTab === 'explorer' && (
            <div
              id="explorer-panel"
              role="tabpanel"
              aria-labelledby="explorer-tab"
              className="h-full w-full flex-1"
            >
              <Explorer />
            </div>
          )}
          {activeTab === 'commands' && (
            <div
              id="commands-panel"
              role="tabpanel"
              aria-labelledby="commands-tab"
              className="h-full w-full flex-1"
            >
              <Commands />
            </div>
          )}
        </Suspense>
      </main>
    </div>
  );
}

interface TabButtonProps {
  id: string;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  'aria-controls': string;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}

const TabButton = forwardRef<HTMLButtonElement, TabButtonProps>(
  function TabButton(
    { id, active, onClick, children, 'aria-controls': ariaControls, onKeyDown },
    ref
  ) {
    return (
      <button
        ref={ref}
        id={id}
        role="tab"
        aria-selected={active}
        aria-controls={ariaControls}
        tabIndex={active ? 0 : -1}
        onClick={onClick}
        onKeyDown={onKeyDown}
        className={cn(
          'rounded-md px-4 py-1.5 text-sm font-medium transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1',
          active
            ? 'bg-accent text-white'
            : 'text-text-secondary hover:bg-surface hover:text-text-primary'
        )}
      >
        {children}
      </button>
    );
  }
);

export default App;
