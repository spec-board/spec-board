import { create } from 'zustand';

const SETTINGS_KEY = 'specboard-settings';

export type Theme = 'light' | 'dark' | 'system';
export type AIProvider = 'openai' | 'anthropic';

interface AISettings {
  provider: AIProvider;
  openaiBaseUrl?: string;  // Custom API base URL for OpenAI-compatible APIs
  anthropicBaseUrl?: string; // Custom API base URL for Anthropic-compatible APIs
  openaiApiKey?: string;
  anthropicApiKey?: string;
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

  // Actions
  setShortcutsEnabled: (enabled: boolean) => void;
  setTheme: (theme: Theme) => void;
  setAISettings: (settings: Partial<AISettings>) => Promise<void>;
  loadSettings: () => void;
}

const DEFAULT_SETTINGS: Settings = {
  shortcutsEnabled: true, // Default: shortcuts are enabled
  theme: 'dark', // Default: dark theme
  aiSettings: {
    provider: 'anthropic', // Default to Anthropic
  },
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
  // Don't save API keys to localStorage for security
  const safeSettings = {
    ...settings,
    aiSettings: {
      provider: settings.aiSettings.provider,
      // Don't persist API keys to localStorage
    },
  };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(safeSettings));
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
  aiSettings: DEFAULT_SETTINGS.aiSettings,

  setShortcutsEnabled: (enabled: boolean) => {
    const { theme, aiSettings } = get();
    set({ shortcutsEnabled: enabled });
    saveSettingsToStorage({ shortcutsEnabled: enabled, theme, aiSettings });
  },

  setTheme: (theme: Theme) => {
    const { shortcutsEnabled, aiSettings } = get();
    const resolvedTheme = resolveTheme(theme);
    applyTheme(resolvedTheme);
    set({ theme, resolvedTheme });
    saveSettingsToStorage({ shortcutsEnabled, theme, aiSettings });
  },

  setAISettings: async (settings: Partial<AISettings>) => {
    const { shortcutsEnabled, theme, aiSettings } = get();
    const newAiSettings = { ...aiSettings, ...settings };
    set({ aiSettings: newAiSettings });

    // Save non-sensitive settings to localStorage
    saveSettingsToStorage({ shortcutsEnabled, theme, aiSettings: newAiSettings });

    // Save settings server-side (API keys, baseUrl)
    if (settings.openaiApiKey || settings.anthropicApiKey || settings.openaiBaseUrl !== undefined || settings.anthropicBaseUrl !== undefined) {
      try {
        await fetch('/api/settings/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider: newAiSettings.provider,
            openaiBaseUrl: newAiSettings.openaiBaseUrl,
            anthropicBaseUrl: newAiSettings.anthropicBaseUrl,
            openaiApiKey: settings.openaiApiKey,
            anthropicApiKey: settings.anthropicApiKey,
          }),
        });
      } catch (error) {
        console.error('Failed to save AI settings:', error);
      }
    } else if (settings.provider) {
      // Just update provider
      try {
        await fetch('/api/settings/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider: newAiSettings.provider,
          }),
        });
      } catch (error) {
        console.error('Failed to save AI settings:', error);
      }
    }
  },

  loadSettings: () => {
    const settings = loadSettingsFromStorage();
    const resolvedTheme = resolveTheme(settings.theme);
    applyTheme(resolvedTheme);

    // Load API keys from server (they're stored server-side for security)
    let aiSettings = settings.aiSettings;

    set({
      shortcutsEnabled: settings.shortcutsEnabled,
      theme: settings.theme,
      resolvedTheme,
      aiSettings,
    });

    // Fetch API keys from server
    fetch('/api/settings/ai')
      .then(res => res.json())
      .then(data => {
        if (data.provider) {
          set({ aiSettings: { ...aiSettings, provider: data.provider, openaiBaseUrl: data.openaiBaseUrl, anthropicBaseUrl: data.anthropicBaseUrl } });
        }
      })
      .catch(() => {
        // Ignore errors - will use default
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
