'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Loader2, Plus, Trash2, ChevronUp, ChevronDown, Download, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSettingsStore, type SettingsSection } from '@/lib/settings-store';

interface ShortcutGroup {
  title: string;
  shortcuts: { keys: string[]; description: string }[];
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: 'Feature Detail',
    shortcuts: [
      { keys: ['Esc'], description: 'Close split view' },
      { keys: ['Tab'], description: 'Switch panes' },
      { keys: ['1-9'], description: 'Jump to section' },
      { keys: ['Up', 'Down'], description: 'Navigate sections' },
      { keys: ['Enter'], description: 'Open section' },
    ],
  },
  {
    title: 'Project',
    shortcuts: [
      { keys: ['Enter'], description: 'Open feature' },
      { keys: ['Space'], description: 'Open feature' },
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
        <p className="text-sm text-[var(--muted-foreground)]">Navigate SpecBoard faster</p>
      </div>
      <div className="bg-[var(--secondary)]/30 rounded-lg p-4 border border-[var(--border)]">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Enable Keyboard Shortcuts</span>
          <button
            onClick={() => setShortcutsEnabled(!shortcutsEnabled)}
            className={cn(
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
              shortcutsEnabled ? 'bg-[var(--foreground)]' : 'bg-[var(--secondary)]'
            )}
            role="switch"
            aria-checked={shortcutsEnabled}
          >
            <span className={cn(
              'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
              shortcutsEnabled ? 'translate-x-6' : 'translate-x-1'
            )} />
          </button>
        </div>
      </div>
      <div className={cn('grid grid-cols-1 lg:grid-cols-2 gap-4', !shortcutsEnabled && 'opacity-50 pointer-events-none')}>
        {SHORTCUT_GROUPS.map((group, index) => (
          <div key={index} className="space-y-1">
            <h3 className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide mb-2">{group.title}</h3>
            <div className="bg-[var(--secondary)]/30 rounded-lg p-3 border border-[var(--border)]">
              {group.shortcuts.map((s, i) => <ShortcutRow key={i} keys={s.keys} description={s.description} />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English', flag: '🇺🇸' },
  { value: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
];

const PROVIDER_PRESETS: Record<string, { label: string; baseUrl: string; model: string; apiKeyPlaceholder: string; description: string; fixedBaseUrl?: boolean }> = {
  openai: { label: 'OpenAI', baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o', apiKeyPlaceholder: 'sk-...', description: 'GPT-4o, o3, Codex mini' },
  mistral: { label: 'Mistral', baseUrl: 'https://api.mistral.ai/v1', model: 'codestral-latest', apiKeyPlaceholder: 'sk-...', description: 'Codestral, Mistral Large', fixedBaseUrl: true },
  anthropic: { label: 'Anthropic', baseUrl: 'https://api.anthropic.com', model: 'claude-sonnet-4-20250514', apiKeyPlaceholder: 'sk-ant-...', description: 'Claude Sonnet, Opus, Haiku' },
  gemini: { label: 'Google Gemini', baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai', model: 'gemini-2.5-flash', apiKeyPlaceholder: 'AIza...', description: 'Gemini 2.5 Flash/Pro' },
};

interface ProviderItem {
  id: string; provider: string; label: string; baseUrl: string; model: string;
  enabled: boolean; priority: number; hasApiKey: boolean; hasOAuth: boolean;
}

function ProviderApiKeyInput({ providerId, hasApiKey, onSaved }: { providerId: string; hasApiKey: boolean; onSaved: () => void }) {
  const [apiKey, setApiKey] = useState('');
  const [saving, setSaving] = useState(false);
  const handleSave = async () => {
    if (!apiKey.trim()) return;
    setSaving(true);
    await fetch('/api/settings/ai/provider-configs', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: providerId, apiKey: apiKey.trim() }),
    });
    await fetch('/api/settings/ai', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: apiKey.trim() }),
    }).catch(() => {});
    setApiKey(''); setSaving(false); onSaved();
  };
  return (
    <div className="flex gap-2">
      <input type="password" value={hasApiKey ? '***' : apiKey} onChange={(e) => setApiKey(e.target.value)}
        placeholder="API key"
        className="flex-1 px-2 py-1.5 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg outline-none focus:border-[var(--ring)]" />
      <button onClick={handleSave} disabled={saving || (!apiKey.trim() && !hasApiKey)}
        className="px-2 py-1.5 text-xs bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg disabled:opacity-50">
        {saving ? '...' : 'Save'}
      </button>
    </div>
  );
}

function ProviderRow({ item, index, total, onToggle, onMoveUp, onMoveDown, onDelete, onSaved }: {
  item: ProviderItem; index: number; total: number;
  onToggle: () => void; onMoveUp: () => void; onMoveDown: () => void; onDelete: () => void; onSaved: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const preset = PROVIDER_PRESETS[item.provider];
  return (
    <div className={cn('border rounded-lg', item.enabled ? 'border-[var(--border)]' : 'border-[var(--border)] opacity-50')}>
      <div className="flex items-center gap-2 px-3 py-2.5">
        <span className="flex items-center justify-center w-5 h-5 rounded text-[10px] font-mono font-bold bg-[var(--secondary)] text-[var(--muted-foreground)] shrink-0">{index + 1}</span>
        <button onClick={() => setExpanded(!expanded)} className="flex-1 text-left min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium truncate">{item.label}</span>
            <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', item.hasApiKey ? 'bg-[var(--foreground)]' : 'bg-amber-500')} />
          </div>
          <span className="text-[10px] text-[var(--muted-foreground)] truncate block">{item.model}</span>
        </button>
        <div className="flex items-center gap-0.5 shrink-0">
          <button onClick={onMoveUp} disabled={index === 0} className="p-1 rounded hover:bg-[var(--secondary)] disabled:opacity-30"><ChevronUp className="w-3.5 h-3.5 text-[var(--muted-foreground)]" /></button>
          <button onClick={onMoveDown} disabled={index === total - 1} className="p-1 rounded hover:bg-[var(--secondary)] disabled:opacity-30"><ChevronDown className="w-3.5 h-3.5 text-[var(--muted-foreground)]" /></button>
          <button onClick={onToggle} role="switch" aria-checked={item.enabled}
            className={cn('relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors', item.enabled ? 'bg-[var(--foreground)]' : 'bg-[var(--border)]')}>
            <span className={cn('pointer-events-none inline-block h-4 w-4 rounded-full bg-[var(--background)] shadow-sm transition-transform', item.enabled ? 'translate-x-4' : 'translate-x-0')} />
          </button>
          <button onClick={onDelete} className="p-1 rounded hover:bg-[var(--secondary)]"><Trash2 className="w-3.5 h-3.5 text-[var(--muted-foreground)]" /></button>
        </div>
      </div>
      {expanded && (
        <div className="px-3 pb-3 pt-1 border-t border-[var(--border)] space-y-2">
          <ProviderApiKeyInput providerId={item.id} hasApiKey={item.hasApiKey} onSaved={onSaved} />
          {!preset?.fixedBaseUrl && <div className="text-[10px] text-[var(--muted-foreground)]">Base URL: <span className="font-mono">{item.baseUrl}</span></div>}
        </div>
      )}
    </div>
  );
}

function AddProviderDialog({ onAdd, onClose }: { onAdd: () => void; onClose: () => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [customModel, setCustomModel] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [error, setError] = useState('');

  const handleAdd = async () => {
    if (!selected) return;
    setAdding(true); setError('');
    try {
      const preset = PROVIDER_PRESETS[selected];
      const res = await fetch('/api/settings/ai/provider-configs', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: selected, label: preset.label + (customModel ? ` (${customModel})` : ''),
          baseUrl: customUrl || preset.baseUrl, model: customModel || preset.model, apiKey: apiKeyInput.trim(),
        }),
      });
      if (!res.ok) { setError((await res.json().catch(() => ({}))).error || 'Failed'); return; }
      await fetch('/api/settings/ai', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: selected, baseUrl: customUrl || preset.baseUrl, model: customModel || preset.model, apiKey: apiKeyInput.trim() }),
      }).catch(() => {});
      onAdd();
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed'); }
    finally { setAdding(false); }
  };

  return (
    <div className="space-y-3 p-3 bg-[var(--secondary)]/30 rounded-lg border border-[var(--border)]">
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium text-[var(--muted-foreground)]">Add Provider</div>
        <button onClick={onClose} className="p-0.5 rounded hover:bg-[var(--secondary)]"><X className="w-3.5 h-3.5 text-[var(--muted-foreground)]" /></button>
      </div>
      <div className="flex flex-col gap-1">
        {Object.entries(PROVIDER_PRESETS).map(([key, preset]) => (
          <button key={key} onClick={() => { setSelected(key); setCustomModel(''); setCustomUrl(''); setApiKeyInput(''); setError(''); }}
            className={cn('flex items-center gap-3 px-3 py-2 rounded-lg border text-left transition-colors',
              selected === key ? 'border-[var(--ring)] bg-[var(--accent)]' : 'border-[var(--border)] bg-[var(--background)] hover:border-[var(--ring)]/50')}>
            <div className="min-w-0">
              <span className="text-xs font-medium block">{preset.label}</span>
              <span className="text-[9px] text-[var(--muted-foreground)]">{preset.description}</span>
            </div>
          </button>
        ))}
      </div>
      {selected && (
        <div className="space-y-2">
          <input type="password" value={apiKeyInput} onChange={(e) => setApiKeyInput(e.target.value)}
            placeholder={PROVIDER_PRESETS[selected]?.apiKeyPlaceholder || 'API key'}
            className="w-full px-2 py-1.5 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg outline-none focus:border-[var(--ring)]" />
          {!PROVIDER_PRESETS[selected]?.fixedBaseUrl && (
            <input type="text" value={customUrl} onChange={(e) => setCustomUrl(e.target.value)}
              placeholder={PROVIDER_PRESETS[selected]?.baseUrl || 'Base URL (optional)'}
              className="w-full px-2 py-1.5 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg outline-none focus:border-[var(--ring)]" />
          )}
          <input type="text" value={customModel} onChange={(e) => setCustomModel(e.target.value)}
            placeholder={PROVIDER_PRESETS[selected]?.model || 'Model (optional)'}
            className="w-full px-2 py-1.5 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg outline-none focus:border-[var(--ring)]" />
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button onClick={handleAdd} disabled={!apiKeyInput.trim() || adding}
            className="w-full px-3 py-1.5 text-xs bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg disabled:opacity-50">
            {adding ? 'Adding...' : 'Add Provider'}
          </button>
        </div>
      )}
    </div>
  );
}

function AIContent() {
  const [providers, setProviders] = useState<ProviderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const { language, setLanguage } = useSettingsStore();

  const loadProviders = useCallback(async () => {
    try {
      const res = await fetch('/api/settings/ai/provider-configs');
      if (res.ok) setProviders(await res.json());
    } catch {}
    setIsLoading(false);
  }, []);

  useEffect(() => { loadProviders(); }, [loadProviders]);

  const handleToggle = async (id: string, enabled: boolean) => {
    setProviders(prev => prev.map(p => p.id === id ? { ...p, enabled: !enabled } : p));
    const res = await fetch('/api/settings/ai/provider-configs', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, enabled: !enabled }),
    }).catch(() => null);
    if (!res?.ok) setProviders(prev => prev.map(p => p.id === id ? { ...p, enabled } : p));
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= providers.length) return;
    const reorder = providers.map((p, i) => ({
      id: p.id,
      priority: i === index ? providers[swapIndex].priority : i === swapIndex ? providers[index].priority : p.priority,
    }));
    await fetch('/api/settings/ai/provider-configs', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reorder }),
    });
    loadProviders();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/settings/ai/provider-configs?id=${id}`, { method: 'DELETE' }).catch(() => {});
    setConfirmDeleteId(null);
    loadProviders();
  };

  const handleImportEnv = async () => {
    setImporting(true);
    await fetch('/api/settings/ai/provider-configs/import-env', { method: 'POST' }).catch(() => {});
    setImporting(false);
    loadProviders();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-1">AI Output Language</h2>
        <div className="bg-[var(--secondary)]/30 rounded-lg p-4 border border-[var(--border)] mt-3">
          <div className="flex flex-wrap gap-2">
            {LANGUAGE_OPTIONS.map((opt) => (
              <button key={opt.value} onClick={() => setLanguage(opt.value as 'en' | 'vi')}
                className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm transition-colors',
                  language === opt.value ? 'border-[var(--ring)] bg-[var(--accent)] font-medium' : 'border-[var(--border)] bg-[var(--background)] hover:border-[var(--ring)]/50')}>
                <span>{opt.flag}</span><span>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-1">AI Providers</h2>
        <p className="text-sm text-[var(--muted-foreground)]">Higher priority (top) is tried first; failed requests auto-fallback.</p>
      </div>

      <div className="space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-8"><Loader2 className="w-4 h-4 animate-spin text-[var(--muted-foreground)]" /></div>
        ) : providers.length === 0 ? (
          <div className="text-center py-6 text-sm text-[var(--muted-foreground)]">No providers configured.</div>
        ) : (
          providers.map((item, index) => (
            <ProviderRow key={item.id} item={item} index={index} total={providers.length}
              onToggle={() => handleToggle(item.id, item.enabled)}
              onMoveUp={() => handleMove(index, 'up')}
              onMoveDown={() => handleMove(index, 'down')}
              onDelete={() => setConfirmDeleteId(item.id)}
              onSaved={loadProviders} />
          ))
        )}
      </div>

      {confirmDeleteId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmDeleteId(null)} />
          <div className="relative bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-xl p-5 w-[320px] space-y-4">
            <p className="text-sm">Remove <span className="font-medium">{providers.find(p => p.id === confirmDeleteId)?.label}</span>?</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirmDeleteId(null)} className="px-3 py-1.5 text-xs rounded-lg border border-[var(--border)] hover:bg-[var(--secondary)]">Cancel</button>
              <button onClick={() => handleDelete(confirmDeleteId)} className="px-3 py-1.5 text-xs rounded-lg bg-red-500 text-white hover:bg-red-600">Remove</button>
            </div>
          </div>
        </div>
      )}

      {showAdd && <AddProviderDialog onAdd={() => { setShowAdd(false); loadProviders(); }} onClose={() => setShowAdd(false)} />}

      {!showAdd && (
        <div className="flex gap-2">
          <button onClick={() => setShowAdd(true)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-xs border border-dashed border-[var(--border)] rounded-lg hover:border-[var(--ring)]/50 hover:bg-[var(--secondary)]/30 text-[var(--muted-foreground)]">
            <Plus className="w-3.5 h-3.5" /> Add Provider
          </button>
          <button onClick={handleImportEnv} disabled={importing}
            className="flex items-center justify-center gap-2 px-4 py-2 text-xs border border-dashed border-[var(--border)] rounded-lg hover:border-[var(--ring)]/50 hover:bg-[var(--secondary)]/30 text-[var(--muted-foreground)] disabled:opacity-50">
            {importing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} Env
          </button>
        </div>
      )}
    </div>
  );
}

function AboutContent() {
  const [appInfo, setAppInfo] = useState<{ version: string; license: string; repository: string } | null>(null);
  useEffect(() => {
    fetch('/api/app-info').then(r => r.ok ? r.json() : null).then(setAppInfo).catch(() => {});
  }, []);
  if (!appInfo) return <div className="text-sm text-[var(--muted-foreground)] py-8 text-center">Loading...</div>;
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">About</h2>
      <div className="bg-[var(--secondary)]/30 rounded-lg p-4 border border-[var(--border)] flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-[var(--muted-foreground)]">Version</span>
          <span className="font-mono text-xs px-2 py-0.5 bg-[var(--secondary)] rounded border border-[var(--border)]">v{appInfo.version}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[var(--muted-foreground)]">License</span>
          <span>{appInfo.license}</span>
        </div>
        {appInfo.repository && (
          <a href={appInfo.repository} target="_blank" rel="noopener noreferrer"
            className="text-[var(--foreground)] underline underline-offset-2 hover:opacity-70 flex items-center gap-1">
            GitHub <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  );
}

const MENU_ITEMS: { id: SettingsSection; label: string }[] = [
  { id: 'ai', label: 'AI Settings' },
  { id: 'shortcuts', label: 'Shortcuts' },
  { id: 'about', label: 'About' },
];

export function SettingsModal() {
  const { settingsOpen, settingsSection, closeSettings } = useSettingsStore();
  const [activeSection, setActiveSection] = useState<SettingsSection>(settingsSection);

  useEffect(() => { if (settingsOpen) setActiveSection(settingsSection); }, [settingsOpen, settingsSection]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => { if (e.key === 'Escape') closeSettings(); }, [closeSettings]);

  useEffect(() => {
    if (settingsOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      return () => { document.removeEventListener('keydown', handleKeyDown); document.body.style.overflow = ''; };
    }
  }, [settingsOpen, handleKeyDown]);

  if (!settingsOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeSettings} />
      <div className="relative w-[90vw] max-w-[900px] h-[85vh] max-h-[900px] bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <h1 className="text-lg font-bold">Settings</h1>
          <button onClick={closeSettings} className="btn-icon" aria-label="Close settings"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 flex min-h-0">
          <aside className="w-[200px] shrink-0 border-r border-[var(--border)] bg-[var(--card)] p-3">
            <nav className="space-y-1">
              {MENU_ITEMS.map((item) => (
                <button key={item.id} onClick={() => setActiveSection(item.id)}
                  className={cn('w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                    activeSection === item.id ? 'bg-[var(--secondary)] text-[var(--foreground)]' : 'text-[var(--muted-foreground)] hover:bg-[var(--secondary)]/50 hover:text-[var(--foreground)]')}>
                  {item.label}
                </button>
              ))}
            </nav>
          </aside>
          <main className="flex-1 p-6 overflow-y-auto">
            {activeSection === 'ai' && <AIContent />}
            {activeSection === 'shortcuts' && <ShortcutsContent />}
            {activeSection === 'about' && <AboutContent />}
          </main>
        </div>
      </div>
    </div>
  );
}
