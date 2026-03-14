'use client';

import { useEffect } from 'react';
import { useSettingsStore } from '@/lib/settings-store';

/**
 * ThemeProvider initializes theme and settings once on app mount.
 * Skips re-fetching if settings were already loaded (e.g. on client navigation).
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const loadSettings = useSettingsStore((state) => state.loadSettings);
  const isLoaded = useSettingsStore((state) => state.isLoaded);

  useEffect(() => {
    if (!isLoaded) {
      loadSettings();
    }
  }, [loadSettings, isLoaded]);

  return <>{children}</>;
}
