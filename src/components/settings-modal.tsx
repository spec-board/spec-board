'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Keyboard, Info, Github, ExternalLink, FileText, History, Palette, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSettingsStore, type AIProvider, type SettingsSection } from '@/lib/settings-store';
import { ReadmeViewer } from '@/components/readme-viewer';
import { ThemeToggle } from '@/components/theme-toggle';
import { ChangelogViewer } from '@/components/changelog-viewer';

interface AppInfo {
  name: string;
  version: string;
  description: string;
  license: string;
  licenseUrl: string;
  repository: string;
  readme: string;
  changelog: string;
}

interface ShortcutGroup {
  title: string;
  shortcuts: { keys: string[]; description: string }[];
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: 'Feature Detail',
    shortcuts: [
      { keys: ['Esc'], description: 'Close split view' },
      { keys: ['Ctrl', '\\'], description: 'Toggle split view' },
      { keys: ['Tab'], description: 'Switch panes (split mode)' },
      { keys: ['1-9'], description: 'Jump to section' },
      { keys: ['Shift', '1-9'], description: 'Open in right pane' },
      { keys: ['Up', 'Down'], description: 'Navigate sections' },
      { keys: ['Enter'], description: 'Open section' },
      { keys: ['Shift', 'Enter'], description: 'Open in split view' },
    ],
  },
  {
    title: 'Split View',
    shortcuts: [
      { keys: ['Left', 'Right'], description: 'Adjust split ratio' },
    ],
  },
  {
    title: 'Kanban Board',
    shortcuts: [
      { keys: ['Enter'], description: 'Open feature' },
      { keys: ['Space'], description: 'Open feature' },
    ],
  },
  {
    title: 'Project Selector',
    shortcuts: [
      { keys: ['H'], description: 'Home directory' },
      { keys: ['Backspace'], description: 'Parent directory' },
      { keys: ['Up', 'Down'], description: 'Navigate list' },
      { keys: ['Enter'], description: 'Open/select' },
      { keys: ['Tab'], description: 'Accept suggestion' },
      { keys: ['Esc'], description: 'Close modal' },
    ],
  },
];

function KeyBadge({ children }: { children: React.ReactNode }) {
  return (
    <kbd className={cn(
      'inline-flex items-center justify-center min-w-[22px] h-5 px-1',
      'bg-[var(--secondary)] border border-[var(--border)] rounded',
      'text-[10px] font-mono font-medium text-[var(--foreground)]'
    )}>
      {children}
    </kbd>
  );
}

function ShortcutRow({ keys, description }: { keys: string[]; description: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-[var(--border)] last:border-0">
      <span className="text-xs text-[var(--muted-foreground)]">{description}</span>
      <div className="flex items-center gap-0.5">
        {keys.map((key, index) => (
          <span key={index} className="flex items-center gap-0.5">
            <KeyBadge>{key}</KeyBadge>
            {index < keys.length - 1 && (
              <span className="text-[10px] text-[var(--muted-foreground)]">+</span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}

function ShortcutsContent() {
  const { shortcutsEnabled, setShortcutsEnabled } = useSettingsStore();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-1">Keyboard Shortcuts</h2>
        <p className="text-sm text-[var(--muted-foreground)]">
          Navigate SpecBoard faster with keyboard shortcuts
        </p>
      </div>

      <div className="bg-[var(--secondary)]/30 rounded-lg p-4 border border-[var(--border)]">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-medium">Enable Keyboard Shortcuts</span>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
              Turn off to disable all keyboard shortcuts
            </p>
          </div>
          <button
            onClick={() => setShortcutsEnabled(!shortcutsEnabled)}
            className={cn(
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
              shortcutsEnabled ? 'bg-green-500' : 'bg-[var(--secondary)]'
            )}
            role="switch"
            aria-checked={shortcutsEnabled}
          >
            <span
              className={cn(
                'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                shortcutsEnabled ? 'translate-x-6' : 'translate-x-1'
              )}
            />
          </button>
        </div>
      </div>

      <div className={cn(
        'grid grid-cols-1 lg:grid-cols-2 gap-4 transition-opacity',
        !shortcutsEnabled && 'opacity-50 pointer-events-none'
      )}>
        {SHORTCUT_GROUPS.map((group, index) => (
          <div key={index} className="space-y-1">
            <h3 className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide mb-2">
              {group.title}
            </h3>
            <div className="bg-[var(--secondary)]/30 rounded-lg p-3 border border-[var(--border)]">
              {group.shortcuts.map((shortcut, sIndex) => (
                <ShortcutRow key={sIndex} keys={shortcut.keys} description={shortcut.description} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AppearanceContent() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-1">Appearance</h2>
        <p className="text-sm text-[var(--muted-foreground)]">
          Customize how SpecBoard looks
        </p>
      </div>

      <div className="bg-[var(--secondary)]/30 rounded-lg p-4 border border-[var(--border)]">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-medium">Theme</span>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
              Choose light, dark, or match your system
            </p>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}

function AIContent() {
  const { aiSettings, setAISettings, loadSettings } = useSettingsStore();

  const [formData, setFormData] = useState({
    provider: aiSettings.provider,
    baseUrl: aiSettings.baseUrl || '',
    apiKey: '',
    model: aiSettings.model || '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    const settings = {
      provider: formData.provider,
      baseUrl: formData.baseUrl.trim() || undefined,
      apiKey: formData.apiKey.trim() || undefined,
      model: formData.model.trim() || undefined,
    };
    await setAISettings(settings);
    await loadSettings();
    setIsSaving(false);
    setSaved(true);
    setFormData({ ...formData, apiKey: '' });
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-1">AI Settings</h2>
        <p className="text-sm text-[var(--muted-foreground)]">
          Configure OpenAI-compatible API for feature generation
        </p>
      </div>

      <div className="bg-[var(--secondary)]/30 rounded-lg p-4 border border-[var(--border)] space-y-4">
        <div>
          <label className="text-xs text-[var(--muted-foreground)] block mb-1">Provider</label>
          <div className="px-3 py-2 text-sm bg-[var(--background)] border border-[var(--border)] rounded-lg">
            OpenAI-Compatible API
          </div>
        </div>

        <div>
          <label className="text-xs text-[var(--muted-foreground)] block mb-1">Base URL (Optional)</label>
          <input
            type="text"
            value={formData.baseUrl}
            onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
            placeholder="http://localhost:11434/v1 (for Ollama, LM Studio)"
            className="w-full px-3 py-2 text-sm bg-[var(--background)] border border-[var(--border)] rounded-lg"
          />
        </div>

        <div>
          <label className="text-xs text-[var(--muted-foreground)] block mb-1">API Key</label>
          <input
            type="password"
            value={aiSettings.hasApiKey ? '***' : formData.apiKey}
            onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
            placeholder="sk-... (leave empty to keep existing)"
            className="w-full px-3 py-2 text-sm bg-[var(--background)] border border-[var(--border)] rounded-lg"
          />
        </div>

        <div>
          <label className="text-xs text-[var(--muted-foreground)] block mb-1">Model</label>
          <input
            type="text"
            value={formData.model}
            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
            placeholder="gpt-4o, llama3, mistral, etc."
            className="w-full px-3 py-2 text-sm bg-[var(--background)] border border-[var(--border)] rounded-lg"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full px-4 py-2 text-sm bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save'}
        </button>

        {saved && (
          <div className="text-xs text-green-500 text-center">Settings saved successfully</div>
        )}
      </div>
    </div>
  );
}

function AboutContent() {
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
  const [activeTab, setActiveTab] = useState<'readme' | 'changelog'>('readme');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAppInfo() {
      try {
        const response = await fetch('/api/app-info');
        if (response.ok) {
          const data = await response.json();
          setAppInfo(data);
        }
      } catch (error) {
        console.error('Failed to load app info:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadAppInfo();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-[var(--muted-foreground)]">Loading...</div>
      </div>
    );
  }

  if (!appInfo) {
    return <div className="text-red-400">Failed to load app information</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-1">About</h2>
        <p className="text-sm text-[var(--muted-foreground)]">
          Application information and documentation
        </p>
      </div>

      <div className="flex gap-1 border-b border-[var(--border)]">
        <button
          onClick={() => setActiveTab('readme')}
          className={cn(
            'px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
            activeTab === 'readme'
              ? 'border-blue-500 text-[var(--foreground)]'
              : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
          )}
        >
          <FileText className="w-4 h-4 inline-block mr-2" />
          README
        </button>
        <button
          onClick={() => setActiveTab('changelog')}
          className={cn(
            'px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
            activeTab === 'changelog'
              ? 'border-blue-500 text-[var(--foreground)]'
              : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
          )}
        >
          <History className="w-4 h-4 inline-block mr-2" />
          Changelog
        </button>
      </div>

      {activeTab === 'readme' && (
        <div className="space-y-4">
          <div className="bg-[var(--secondary)]/30 rounded-lg p-4 border border-[var(--border)]">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-[var(--muted-foreground)]">Version</span>
                <span className="font-mono text-xs px-2 py-0.5 bg-[var(--secondary)] rounded border border-[var(--border)]">
                  v{appInfo.version}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[var(--muted-foreground)]">License</span>
                <a
                  href={appInfo.licenseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  {appInfo.license}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={appInfo.repository}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  <Github className="w-4 h-4" />
                  GitHub
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          <div className="bg-[var(--secondary)]/30 rounded-lg p-4 border border-[var(--border)]">
            <ReadmeViewer content={appInfo.readme} />
          </div>
        </div>
      )}

      {activeTab === 'changelog' && (
        <div className="bg-[var(--secondary)]/30 rounded-lg p-4 border border-[var(--border)]">
          <ChangelogViewer content={appInfo.changelog} />
        </div>
      )}
    </div>
  );
}

const MENU_ITEMS: { id: SettingsSection; label: string; icon: React.ReactNode }[] = [
  { id: 'ai', label: 'AI Settings', icon: <Sparkles className="w-4 h-4" /> },
  { id: 'shortcuts', label: 'Shortcuts', icon: <Keyboard className="w-4 h-4" /> },
  { id: 'appearance', label: 'Appearance', icon: <Palette className="w-4 h-4" /> },
  { id: 'about', label: 'About', icon: <Info className="w-4 h-4" /> },
];

export function SettingsModal() {
  const { settingsOpen, settingsSection, closeSettings } = useSettingsStore();
  const [activeSection, setActiveSection] = useState<SettingsSection>(settingsSection);

  // Sync activeSection when modal opens with a specific section
  useEffect(() => {
    if (settingsOpen) {
      setActiveSection(settingsSection);
    }
  }, [settingsOpen, settingsSection]);

  // Close on Escape key
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      closeSettings();
    }
  }, [closeSettings]);

  useEffect(() => {
    if (settingsOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';
      };
    }
  }, [settingsOpen, handleKeyDown]);

  if (!settingsOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={closeSettings}
      />

      {/* Modal */}
      <div className="relative w-[90vw] max-w-[900px] h-[80vh] max-h-[700px] bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <h1 className="text-lg font-bold">Settings</h1>
          <button
            onClick={closeSettings}
            className="btn-icon"
            aria-label="Close settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body — 2 column layout */}
        <div className="flex-1 flex min-h-0">
          {/* Left sidebar menu */}
          <aside className="w-[200px] shrink-0 border-r border-[var(--border)] bg-[var(--card)] p-3">
            <nav className="space-y-1">
              {MENU_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                    activeSection === item.id
                      ? 'bg-[var(--secondary)] text-[var(--foreground)]'
                      : 'text-[var(--muted-foreground)] hover:bg-[var(--secondary)]/50 hover:text-[var(--foreground)]'
                  )}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </nav>
          </aside>

          {/* Right content area */}
          <main className="flex-1 p-6 overflow-y-auto">
            {activeSection === 'ai' && <AIContent />}
            {activeSection === 'shortcuts' && <ShortcutsContent />}
            {activeSection === 'appearance' && <AppearanceContent />}
            {activeSection === 'about' && <AboutContent />}
          </main>
        </div>
      </div>
    </div>
  );
}
