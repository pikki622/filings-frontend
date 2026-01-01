import { useState } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Explorer } from './components/explorer';
import { Commands } from './components/commands';

type Tab = 'explorer' | 'commands';

function cn(...inputs: (string | undefined | null | boolean)[]) {
  return twMerge(clsx(inputs));
}

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('explorer');

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden">
      {/* Header with tabs */}
      <header className="flex h-12 shrink-0 items-center border-b border-border bg-surface px-4">
        <nav className="flex gap-1">
          <TabButton
            active={activeTab === 'explorer'}
            onClick={() => setActiveTab('explorer')}
          >
            Explorer
          </TabButton>
          <TabButton
            active={activeTab === 'commands'}
            onClick={() => setActiveTab('commands')}
          >
            Commands
          </TabButton>
        </nav>
      </header>

      {/* Main content area */}
      <main className="flex flex-1 overflow-hidden">
        {activeTab === 'explorer' && <ExplorerView />}
        {activeTab === 'commands' && <CommandsView />}
      </main>
    </div>
  );
}

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function TabButton({ active, onClick, children }: TabButtonProps) {
  return (
    <button
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

function ExplorerView() {
  return <Explorer />;
}

function CommandsView() {
  return <Commands />;
}

export default App;
