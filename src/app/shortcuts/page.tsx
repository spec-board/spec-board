'use client';

import Link from 'next/link';
import { ArrowLeft, Keyboard } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ShortcutGroup {
  title: string;
  description: string;
  shortcuts: { keys: string[]; description: string }[];
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: 'Feature Detail Page',
    description: 'Shortcuts available when viewing a feature',
    shortcuts: [
      { keys: ['Esc'], description: 'Close split view (when active)' },
      { keys: ['Ctrl', '\\'], description: 'Toggle split view' },
      { keys: ['Tab'], description: 'Switch focus between panes (in split mode)' },
      { keys: ['1-9'], description: 'Jump to section by number' },
      { keys: ['Shift', '1-9'], description: 'Open section in right pane' },
      { keys: ['↑', '↓'], description: 'Navigate sections' },
      { keys: ['Enter'], description: 'Open selected section' },
      { keys: ['Shift', 'Enter'], description: 'Open selected section in split view' },
    ],
  },
  {
    title: 'Split View',
    description: 'Shortcuts for adjusting the split view divider',
    shortcuts: [
      { keys: ['←', '→'], description: 'Adjust split ratio (when divider is focused)' },
    ],
  },
  {
    title: 'Kanban Board',
    description: 'Shortcuts for navigating the feature board',
    shortcuts: [
      { keys: ['Enter'], description: 'Open selected feature' },
      { keys: ['Space'], description: 'Open selected feature' },
    ],
  },
  {
    title: 'Project Selector',
    description: 'Shortcuts for browsing and selecting projects',
    shortcuts: [
      { keys: ['H'], description: 'Go to home directory' },
      { keys: ['Backspace'], description: 'Go to parent directory' },
      { keys: ['↑', '↓'], description: 'Navigate directory list' },
      { keys: ['Enter'], description: 'Open directory or select project' },
      { keys: ['Tab'], description: 'Accept path suggestion' },
      { keys: ['Esc'], description: 'Close modal' },
    ],
  },
  {
    title: 'Open Project Modal',
    description: 'Shortcuts for the project search modal',
    shortcuts: [
      { keys: ['↑', '↓'], description: 'Navigate suggestions' },
      { keys: ['Tab'], description: 'Accept selected suggestion' },
      { keys: ['Enter'], description: 'Open selected project' },
      { keys: ['Esc'], description: 'Close modal' },
    ],
  },
];

function KeyBadge({ children }: { children: React.ReactNode }) {
  return (
    <kbd className={cn(
      'inline-flex items-center justify-center min-w-[24px] h-6 px-1.5',
      'bg-[var(--secondary)] border border-[var(--border)] rounded',
      'text-xs font-mono font-medium text-[var(--foreground)]',
      'shadow-sm'
    )}>
      {children}
    </kbd>
  );
}

function ShortcutRow({ keys, description }: { keys: string[]; description: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0">
      <span className="text-sm text-[var(--muted-foreground)]">{description}</span>
      <div className="flex items-center gap-1">
        {keys.map((key, index) => (
          <span key={index} className="flex items-center gap-1">
            <KeyBadge>{key}</KeyBadge>
            {index < keys.length - 1 && (
              <span className="text-xs text-[var(--muted-foreground)]">+</span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}

function ShortcutSection({ group }: { group: ShortcutGroup }) {
  return (
    <section className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
      <h2 className="text-lg font-semibold mb-1">{group.title}</h2>
      <p className="text-sm text-[var(--muted-foreground)] mb-4">{group.description}</p>
      <div>
        {group.shortcuts.map((shortcut, index) => (
          <ShortcutRow key={index} keys={shortcut.keys} description={shortcut.description} />
        ))}
      </div>
    </section>
  );
}

export default function ShortcutsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-[var(--border)] bg-[var(--card)]">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2 -ml-2 hover:bg-[var(--secondary)] rounded-lg transition-colors"
              aria-label="Back to home"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <Keyboard className="w-8 h-8 text-blue-400" />
              <div>
                <h1 className="text-xl font-bold">Keyboard Shortcuts</h1>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Navigate SpecBoard faster with keyboard shortcuts
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-8">
        <div className="grid gap-6">
          {SHORTCUT_GROUPS.map((group, index) => (
            <ShortcutSection key={index} group={group} />
          ))}
        </div>

        {/* Tips section */}
        <section className="mt-8 bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-blue-400 mb-2">Tips</h2>
          <ul className="space-y-2 text-sm text-[var(--muted-foreground)]">
            <li>• Use number keys <KeyBadge>1</KeyBadge>-<KeyBadge>9</KeyBadge> to quickly jump between sections in the feature detail view</li>
            <li>• Hold <KeyBadge>Shift</KeyBadge> while pressing a number to open that section in split view</li>
            <li>• Press <KeyBadge>Ctrl</KeyBadge>+<KeyBadge>\</KeyBadge> to toggle split view for comparing documents side-by-side</li>
            <li>• Use <KeyBadge>Tab</KeyBadge> to switch focus between left and right panes in split view</li>
          </ul>
        </section>
      </main>
    </div>
  );
}
