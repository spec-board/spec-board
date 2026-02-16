import { create } from 'zustand';

export type Theme = 'light' | 'dark' | 'system';
export type AIProvider = 'openai';

interface AISettings {
  provider: AIProvider;
  baseUrl?: string;
  apiKey?: string;
  model?: string;
  hasApiKey?: boolean;
}

interface Settings {
  shortcutsEnabled: boolean;
  theme: Theme;
  aiSettings: AISettings;
}

interface SettingsStore {
  // State
  shortcutsEnabled: boolean;
  theme: Theme;
  resolvedTheme: 'light' | 'dark'; // Actual theme after resolving 'system'
  aiSettings: AISettings;
  isLoaded: boolean;

  // Actions
  setShortcutsEnabled: (enabled: boolean) => Promise<void>;
  setTheme: (theme: Theme) => Promise<void>;
  setAISettings: (settings: Partial<AISettings>) => Promise<void>;
  loadSettings: () => Promise<void>;
}

const DEFAULT_SETTINGS: Settings = {
  shortcutsEnabled: true, // Default: shortcuts are enabled
  theme: 'dark', // Default: dark theme
  aiSettings: {
    provider: 'openai', // Default to OpenAI-compatible
  },
};

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
  aiSettings: DEFAULT_SETTINGS.aiSettings,
  isLoaded: false,

  setShortcutsEnabled: async (enabled: boolean) => {
    set({ shortcutsEnabled: enabled });

    // Save to database
    try {
      await fetch('/api/settings/app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shortcutsEnabled: enabled }),
      });
    } catch (error) {
      console.error('Failed to save shortcuts setting:', error);
    }
  },

  setTheme: async (theme: Theme) => {
    const resolvedTheme = resolveTheme(theme);
    applyTheme(resolvedTheme);
    set({ theme, resolvedTheme });

    // Save to database
    try {
      await fetch('/api/settings/app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme }),
      });
    } catch (error) {
      console.error('Failed to save theme setting:', error);
    }
  },

  setAISettings: async (settings: Partial<AISettings>) => {
    const { aiSettings } = get();
    const newAiSettings = { ...aiSettings, ...settings };
    set({ aiSettings: newAiSettings });

    // Save settings server-side (API keys, baseUrl)
    if (settings.apiKey || settings.baseUrl !== undefined || settings.model) {
      try {
        await fetch('/api/settings/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider: newAiSettings.provider,
            baseUrl: newAiSettings.baseUrl,
            apiKey: settings.apiKey,
            model: settings.model,
          }),
        });
      } catch (error) {
        console.error('Failed to save AI settings:', error);
      }
    }
  },

  loadSettings: async () => {
    // Load app settings from database
    try {
      const [appRes, aiRes] = await Promise.all([
        fetch('/api/settings/app'),
        fetch('/api/settings/ai'),
      ]);

      const appData = await appRes.json();
      const aiData = await aiRes.json();

      const resolvedTheme = resolveTheme(appData.theme || 'dark');
      applyTheme(resolvedTheme);

      set({
        shortcutsEnabled: appData.shortcutsEnabled ?? DEFAULT_SETTINGS.shortcutsEnabled,
        theme: appData.theme || DEFAULT_SETTINGS.theme,
        resolvedTheme,
        aiSettings: {
          provider: aiData.provider || DEFAULT_SETTINGS.aiSettings.provider,
          baseUrl: aiData.baseUrl,
          model: aiData.model,
          hasApiKey: aiData.hasApiKey,
        },
        isLoaded: true,
      });
    } catch (error) {
      console.error('Failed to load settings from database:', error);
      // Fall back to defaults
      applyTheme('dark');
      set({
        shortcutsEnabled: DEFAULT_SETTINGS.shortcutsEnabled,
        theme: DEFAULT_SETTINGS.theme,
        resolvedTheme: 'dark',
        aiSettings: DEFAULT_SETTINGS.aiSettings,
        isLoaded: true,
      });
    }

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
