'use client';

import { Sun, Moon, Monitor } from 'lucide-react';
import { useSettingsStore, type Theme } from '@/lib/settings-store';

const themeOrder: Theme[] = ['light', 'dark', 'system'];

const themeConfig: Record<Theme, { icon: typeof Sun; label: string }> = {
  light: { icon: Sun, label: 'Light mode' },
  dark: { icon: Moon, label: 'Dark mode' },
  system: { icon: Monitor, label: 'System theme' },
};

export function ThemeButton() {
  const { theme, setTheme } = useSettingsStore();

  const cycleTheme = () => {
    const currentIndex = themeOrder.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themeOrder.length;
    setTheme(themeOrder[nextIndex]);
  };

  const { icon: Icon, label } = themeConfig[theme];

  return (
    <button
      onClick={cycleTheme}
      className="p-2 hover:bg-[var(--secondary)] rounded-lg transition-colors"
      title={`${label} (click to change)`}
      aria-label={`Current: ${label}. Click to cycle theme.`}
    >
      <Icon className="w-5 h-5" />
    </button>
  );
}
