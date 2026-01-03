'use client';

import { Sun, Moon, Monitor } from 'lucide-react';
import { useSettingsStore, type Theme } from '@/lib/settings-store';

const themes: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
];

export function ThemeToggle() {
  const { theme, setTheme } = useSettingsStore();

  return (
    <div className="flex items-center gap-1 p-1 bg-[var(--secondary)] rounded-lg">
      {themes.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          className={`
            p-2 rounded-md transition-colors
            ${theme === value
              ? 'bg-[var(--background)] text-[var(--foreground)] shadow-sm'
              : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
            }
          `}
          title={label}
          aria-label={`Switch to ${label} theme`}
          aria-pressed={theme === value}
        >
          <Icon className="w-4 h-4" />
        </button>
      ))}
    </div>
  );
}
