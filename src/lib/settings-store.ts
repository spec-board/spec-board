import { create } from 'zustand';

const SETTINGS_KEY = 'specboard-settings';

interface Settings {
  shortcutsEnabled: boolean;
}

interface SettingsStore {
  // State
  shortcutsEnabled: boolean;

  // Actions
  setShortcutsEnabled: (enabled: boolean) => void;
  loadSettings: () => void;
}

const DEFAULT_SETTINGS: Settings = {
  shortcutsEnabled: true, // Default: shortcuts are enabled
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

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  shortcutsEnabled: DEFAULT_SETTINGS.shortcutsEnabled,

  setShortcutsEnabled: (enabled: boolean) => {
    set({ shortcutsEnabled: enabled });
    saveSettingsToStorage({ shortcutsEnabled: enabled });
  },

  loadSettings: () => {
    const settings = loadSettingsFromStorage();
    set({ shortcutsEnabled: settings.shortcutsEnabled });
  },
}));
