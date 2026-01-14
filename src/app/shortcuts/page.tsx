'use client';

import Link from 'next/link';
import { ArrowLeft, Keyboard } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getShortcutsGroupedByCategory,
  formatShortcutKeys,
  CATEGORY_LABELS,
} from '@/lib/shortcuts/shortcut-config';
import type { ShortcutCategory } from '@/types';

interface ShortcutGroup {
  title: string;
  description: string;
  shortcuts: { keys: string[]; description: string }[];
}

// Additional context-specific shortcuts not in the global registry
const ADDITIONAL_SHORTCUT_GROUPS: ShortcutGroup[] = [
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
    <kbd
      className={cn(
        'inline-flex items-center justify-center min-w-[24px] h-6 px-1.5',
        'bg-[var(--secondary)] border border-[var(--border)]',
        'font-mono font-medium text-[var(--foreground)]',
        'shadow-sm'
      )}
      style={{ fontSize: 'var(--text-xs)', borderRadius: 'var(--radius)' }}
    >
      {children}
    </kbd>
  );
}

function ShortcutRow({ keys, description }: { keys: string[]; description: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0">
      <span className="text-[var(--muted-foreground)]" style={{ fontSize: 'var(--text-sm)' }}>{description}</span>
      <div className="flex items-center gap-1">
        {keys.map((key, index) => (
          <span key={index} className="flex items-center gap-1">
            <KeyBadge>{key}</KeyBadge>
            {index < keys.length - 1 && (
              <span className="text-[var(--muted-foreground)]" style={{ fontSize: 'var(--text-xs)' }}>+</span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}

function ShortcutSection({ group }: { group: ShortcutGroup }) {
  return (
    <section
      className="bg-[var(--card)] border border-[var(--border)]"
      style={{ padding: 'var(--space-2)', borderRadius: 'var(--radius)' }}
    >
      <h2 className="font-semibold" style={{ fontSize: 'var(--text-lg)', marginBottom: '4px' }}>{group.title}</h2>
      <p className="text-[var(--muted-foreground)]" style={{ fontSize: 'var(--text-sm)', marginBottom: 'var(--space-2)' }}>{group.description}</p>
      <div>
        {group.shortcuts.map((shortcut, index) => (
          <ShortcutRow key={index} keys={shortcut.keys} description={shortcut.description} />
        ))}
      </div>
    </section>
  );
}

export default function ShortcutsPage() {
  const shortcutsByCategory = getShortcutsGroupedByCategory();
  const categories: ShortcutCategory[] = ['navigation', 'actions', 'help'];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-[var(--border)] bg-[var(--card)]">
        <div className="max-w-4xl mx-auto" style={{ padding: 'var(--space-2) var(--space-3)' }}>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2 -ml-2 hover:bg-[var(--secondary)] focus-ring"
              style={{ borderRadius: 'var(--radius)', transition: 'var(--transition-base)' }}
              aria-label="Back to home"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <Keyboard className="w-8 h-8 text-blue-400" />
              <div>
                <h1 className="font-bold" style={{ fontSize: 'var(--text-xl)' }}>Keyboard Shortcuts</h1>
                <p className="text-[var(--muted-foreground)]" style={{ fontSize: 'var(--text-sm)' }}>
                  Navigate SpecBoard faster with keyboard shortcuts
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-4xl mx-auto w-full" style={{ padding: 'var(--space-4) var(--space-3)' }}>
        <div className="grid" style={{ gap: 'var(--space-3)' }}>
          {/* Global shortcuts from centralized config */}
          {categories.map((category) => {
            const shortcuts = shortcutsByCategory[category];
            if (shortcuts.length === 0) return null;

            return (
              <section
                key={category}
                className="bg-[var(--card)] border border-[var(--border)]"
                style={{ padding: 'var(--space-2)', borderRadius: 'var(--radius)' }}
              >
                <h2 className="font-semibold" style={{ fontSize: 'var(--text-lg)', marginBottom: '4px' }}>{CATEGORY_LABELS[category]}</h2>
                <p className="text-[var(--muted-foreground)]" style={{ fontSize: 'var(--text-sm)', marginBottom: 'var(--space-2)' }}>
                  {category === 'navigation' && 'Shortcuts for navigating between views and cards'}
                  {category === 'actions' && 'Shortcuts for performing actions on cards'}
                  {category === 'help' && 'Shortcuts for getting help'}
                </p>
                <div>
                  {shortcuts.map((shortcut) => (
                    <ShortcutRow
                      key={shortcut.id}
                      keys={[formatShortcutKeys(shortcut.keys)]}
                      description={shortcut.description}
                    />
                  ))}
                </div>
              </section>
            );
          })}

          {/* Additional context-specific shortcuts */}
          {ADDITIONAL_SHORTCUT_GROUPS.map((group, index) => (
            <ShortcutSection key={index} group={group} />
          ))}
        </div>

        {/* Tips section */}
        <section
          className="bg-blue-500/10 border border-blue-500/20"
          style={{ marginTop: 'var(--space-4)', padding: 'var(--space-2)', borderRadius: 'var(--radius)' }}
        >
          <h2 className="text-blue-400 font-semibold" style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-1)' }}>Tips</h2>
          <ul className="text-[var(--muted-foreground)]" style={{ fontSize: 'var(--text-sm)', display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
            <li>• Press <KeyBadge>?</KeyBadge> anywhere to open the shortcuts help overlay</li>
            <li>• Use arrow keys <KeyBadge>↑</KeyBadge><KeyBadge>↓</KeyBadge><KeyBadge>←</KeyBadge><KeyBadge>→</KeyBadge> to navigate the Kanban board</li>
            <li>• Use number keys <KeyBadge>1</KeyBadge>-<KeyBadge>9</KeyBadge> to quickly jump between sections in the feature detail view</li>
            <li>• Hold <KeyBadge>Shift</KeyBadge> while pressing a number to open that section in split view</li>
            <li>• Press <KeyBadge>Ctrl</KeyBadge>+<KeyBadge>\</KeyBadge> to toggle split view for comparing documents side-by-side</li>
          </ul>
        </section>
      </main>
    </div>
  );
}
