'use client';

import { useEffect } from 'react';
import { useSettingsStore } from '@/lib/settings-store';

/**
 * ThemeProvider initializes the theme from localStorage on app mount.
 * This ensures the saved theme preference persists across page refreshes.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const loadSettings = useSettingsStore((state) => state.loadSettings);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return <>{children}</>;
}
