import { create } from 'zustand';

const SETTINGS_KEY = 'specboard-settings';

export type Theme = 'light' | 'dark' | 'system';

interface Settings {
  shortcutsEnabled: boolean;
  theme: Theme;
}

interface SettingsStore {
  // State
  shortcutsEnabled: boolean;
  theme: Theme;
  resolvedTheme: 'light' | 'dark'; // Actual theme after resolving 'system'

  // Actions
  setShortcutsEnabled: (enabled: boolean) => void;
  setTheme: (theme: Theme) => void;
  loadSettings: () => void;
}

const DEFAULT_SETTINGS: Settings = {
  shortcutsEnabled: true, // Default: shortcuts are enabled
  theme: 'dark', // Default: dark theme
};

function loadSettingsFromStorage(): Settings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
    return DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveSettingsToStorage(settings: Settings) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

/**
 * Get the system's preferred color scheme
 */
function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Resolve the actual theme based on user preference
 */
function resolveTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') {
    return getSystemTheme();
  }
  return theme;
}

/**
 * Apply theme to the document
 */
function applyTheme(resolvedTheme: 'light' | 'dark') {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(resolvedTheme);
  root.setAttribute('data-theme', resolvedTheme);
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  shortcutsEnabled: DEFAULT_SETTINGS.shortcutsEnabled,
  theme: DEFAULT_SETTINGS.theme,
  resolvedTheme: 'dark',

  setShortcutsEnabled: (enabled: boolean) => {
    const { theme } = get();
    set({ shortcutsEnabled: enabled });
    saveSettingsToStorage({ shortcutsEnabled: enabled, theme });
  },

  setTheme: (theme: Theme) => {
    const { shortcutsEnabled } = get();
    const resolvedTheme = resolveTheme(theme);
    applyTheme(resolvedTheme);
    set({ theme, resolvedTheme });
    saveSettingsToStorage({ shortcutsEnabled, theme });
  },

  loadSettings: () => {
    const settings = loadSettingsFromStorage();
    const resolvedTheme = resolveTheme(settings.theme);
    applyTheme(resolvedTheme);
    set({
      shortcutsEnabled: settings.shortcutsEnabled,
      theme: settings.theme,
      resolvedTheme,
    });

    // Listen for system theme changes when using 'system' theme
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', () => {
        const { theme } = get();
        if (theme === 'system') {
          const newResolvedTheme = getSystemTheme();
          applyTheme(newResolvedTheme);
          set({ resolvedTheme: newResolvedTheme });
        }
      });
    }
  },
}));
