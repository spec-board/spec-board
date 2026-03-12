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
  theme: 'system', // Default: follow device preference
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
  resolvedTheme: resolveTheme('system'),
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
    // Load app settings from database with timeout to avoid blocking navigation
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    try {
      const [appRes, aiRes] = await Promise.all([
        fetch('/api/settings/app', { signal: controller.signal }),
        fetch('/api/settings/ai', { signal: controller.signal }),
      ]);

      // Use defaults if API fails
      let appData = DEFAULT_SETTINGS;
      let aiData = { provider: 'openai', baseUrl: '', model: '', hasApiKey: false };

      if (appRes.ok) {
        appData = await appRes.json();
      } else {
        const err = await appRes.json().catch(() => ({}));
        console.warn('Failed to load app settings:', appRes.status, err);
      }

      if (aiRes.ok) {
        aiData = await aiRes.json();
      } else {
        const err = await aiRes.json().catch(() => ({}));
        console.warn('Failed to load AI settings:', aiRes.status, err);
      }

      const themeValue = appData.theme || DEFAULT_SETTINGS.theme;
      const resolvedTheme = resolveTheme(themeValue);
      applyTheme(resolvedTheme);

      set({
        shortcutsEnabled: appData.shortcutsEnabled ?? DEFAULT_SETTINGS.shortcutsEnabled,
        theme: themeValue,
        resolvedTheme,
        aiSettings: {
          provider: (aiData.provider || DEFAULT_SETTINGS.aiSettings.provider) as AIProvider,
          baseUrl: aiData.baseUrl,
          model: aiData.model,
          hasApiKey: aiData.hasApiKey,
        },
        isLoaded: true,
      });
    } catch (error) {
      console.error('Failed to load settings from database:', error);
      // Fall back to defaults (system preference)
      const fallbackResolved = resolveTheme(DEFAULT_SETTINGS.theme);
      applyTheme(fallbackResolved);
      set({
        shortcutsEnabled: DEFAULT_SETTINGS.shortcutsEnabled,
        theme: DEFAULT_SETTINGS.theme,
        resolvedTheme: fallbackResolved,
        aiSettings: DEFAULT_SETTINGS.aiSettings,
        isLoaded: true,
      });
    } finally {
      clearTimeout(timeout);
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
