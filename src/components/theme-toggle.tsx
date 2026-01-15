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
    <div 
      className="flex items-center rounded-lg"
      style={{
        gap: 'var(--space-1)',
        padding: 'var(--space-1)',
        backgroundColor: 'var(--secondary)',
        borderRadius: 'var(--radius)',
      }}
    >
      {themes.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          className={`
            rounded-md transition-colors
            ${theme === value
              ? 'bg-[var(--background)] text-[var(--foreground)] shadow-sm'
              : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
            }
          `}
          style={{
            padding: 'var(--space-2)',
            borderRadius: 'var(--radius)',
            transitionDuration: 'var(--transition-base)',
          }}
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
