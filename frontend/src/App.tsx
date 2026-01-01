import { useState, Suspense, lazy } from 'react';
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

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('explorer');

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden">
      {/* Header with tabs */}
      <header className="flex h-12 shrink-0 items-center border-b border-border bg-surface px-4">
        <nav className="flex gap-1" role="tablist">
          <TabButton
            active={activeTab === 'explorer'}
            onClick={() => setActiveTab('explorer')}
            aria-controls="explorer-panel"
          >
            Explorer
          </TabButton>
          <TabButton
            active={activeTab === 'commands'}
            onClick={() => setActiveTab('commands')}
            aria-controls="commands-panel"
          >
            Commands
          </TabButton>
        </nav>
      </header>

      {/* Main content area with Suspense for lazy loading */}
      <main className="flex flex-1 overflow-hidden">
        <Suspense fallback={<LoadingFallback />}>
          {activeTab === 'explorer' && (
            <div id="explorer-panel" role="tabpanel" className="flex-1">
              <Explorer />
            </div>
          )}
          {activeTab === 'commands' && (
            <div id="commands-panel" role="tabpanel" className="flex-1">
              <Commands />
            </div>
          )}
        </Suspense>
      </main>
    </div>
  );
}

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  'aria-controls'?: string;
}

function TabButton({ active, onClick, children, 'aria-controls': ariaControls }: TabButtonProps) {
  return (
    <button
      role="tab"
      aria-selected={active}
      aria-controls={ariaControls}
      onClick={onClick}
      className={cn(
        'rounded-md px-4 py-1.5 text-sm font-medium transition-colors',
        active
          ? 'bg-accent text-white'
          : 'text-text-secondary hover:bg-surface hover:text-text-primary'
      )}
    >
      {children}
    </button>
  );
}

export default App;
