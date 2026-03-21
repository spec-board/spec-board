'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { X, Keyboard, Info, Github, ExternalLink, FileText, History, Palette, Sparkles, LogIn, LogOut, Loader2, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSettingsStore, type AIProvider, type SettingsSection } from '@/lib/settings-store';
import { ReadmeViewer } from '@/components/readme-viewer';
import { ThemeToggle } from '@/components/theme-toggle';
import { ChangelogViewer } from '@/components/changelog-viewer';
import { OAUTH_PROVIDERS, generateRandomString, generateCodeChallenge } from '@/lib/ai/oauth-config';

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

const LANGUAGE_OPTIONS: { value: string; label: string; flag: string }[] = [
  { value: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
  { value: 'en', label: 'English', flag: '🇺🇸' },
  { value: 'zh', label: '中文', flag: '🇨🇳' },
  { value: 'ja', label: '日本語', flag: '🇯🇵' },
  { value: 'ko', label: '한국어', flag: '🇰🇷' },
];

function AppearanceContent() {
  const { language, setLanguage } = useSettingsStore();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-1">Appearance</h2>
        <p className="text-sm text-[var(--muted-foreground)]">
          Customize how SpecBoard looks
        </p>
      </div>

      <div className="bg-[var(--secondary)]/30 rounded-lg p-4 border border-[var(--border)] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-medium">Theme</span>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
              Choose light, dark, or match your system
            </p>
          </div>
          <ThemeToggle />
        </div>

        <div className="h-px bg-[var(--border)]" />

        <div>
          <div className="mb-2">
            <span className="text-sm font-medium">AI Output Language</span>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
              Language for AI-generated specs, plans, and tasks
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {LANGUAGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setLanguage(opt.value as any)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm transition-colors',
                  language === opt.value
                    ? 'border-[var(--ring)] bg-[var(--accent)] font-medium'
                    : 'border-[var(--border)] bg-[var(--background)] hover:border-[var(--ring)]/50'
                )}
              >
                <span>{opt.flag}</span>
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const PROVIDER_PRESETS: Record<string, { label: string; baseUrl: string; model: string; apiKeyPlaceholder: string; description: string; oauthOnly?: boolean }> = {
  codex: {
    label: 'OpenAI Codex',
    baseUrl: 'https://api.openai.com/v1',
    model: 'codex-mini-latest',
    apiKeyPlaceholder: '',
    description: 'Code-optimized models via OpenAI account',
    oauthOnly: true,
  },
  qwen: {
    label: 'Qwen',
    baseUrl: 'https://chat.qwen.ai/api/v1',
    model: 'qwen-max',
    apiKeyPlaceholder: '',
    description: 'Qwen-Max, Qwen-Plus via qwen.ai account',
    oauthOnly: true,
  },
  kimi: {
    label: 'Kimi',
    baseUrl: 'https://api.kimi.ai/v1',
    model: 'kimi-latest',
    apiKeyPlaceholder: '',
    description: 'Kimi models via Moonshot account',
    oauthOnly: true,
  },
  openai: {
    label: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o',
    apiKeyPlaceholder: 'sk-...',
    description: 'GPT-4o and other OpenAI models (API key)',
  },
  custom: {
    label: 'Custom',
    baseUrl: '',
    model: '',
    apiKeyPlaceholder: 'API key',
    description: 'Ollama, LM Studio, or any OpenAI-compatible API',
  },
};

// Device code flow UI (Qwen, Kimi)
function DeviceCodeFlow({ provider, onSuccess }: { provider: string; onSuccess: () => void }) {
  const [userCode, setUserCode] = useState('');
  const [verificationUri, setVerificationUri] = useState('');
  const [polling, setPolling] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startFlow = async () => {
    setError('');
    try {
      const res = await fetch('/api/settings/oauth/device-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      });
      if (!res.ok) throw new Error('Failed to start login flow');
      const data = await res.json();
      setUserCode(data.user_code);
      setVerificationUri(data.verification_uri);
      setPolling(true);
      window.open(data.verification_uri, '_blank', 'noopener');

      const interval = (data.interval || 5) * 1000;
      pollingRef.current = setInterval(async () => {
        try {
          const tokenRes = await fetch('/api/settings/oauth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ provider, device_code: data.device_code }),
          });
          const tokenData = await tokenRes.json();
          if (tokenData.status === 'success') {
            if (pollingRef.current) clearInterval(pollingRef.current);
            setPolling(false);
            onSuccess();
          } else if (tokenData.status !== 'pending') {
            if (pollingRef.current) clearInterval(pollingRef.current);
            setPolling(false);
            setError(tokenData.error || 'Login failed');
          }
        } catch { /* keep polling */ }
      }, interval);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start login');
    }
  };

  useEffect(() => {
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(userCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (polling && userCode) {
    return (
      <div className="space-y-3">
        <div className="text-center space-y-2">
          <p className="text-xs text-[var(--muted-foreground)]">Enter this code at the verification page:</p>
          <div className="flex items-center justify-center gap-2">
            <code className="text-2xl font-mono font-bold tracking-widest px-4 py-2 bg-[var(--secondary)] border border-[var(--border)] rounded-lg">
              {userCode}
            </code>
            <button onClick={handleCopy} className="p-2 rounded-lg hover:bg-[var(--secondary)] transition-colors" title="Copy code">
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-[var(--muted-foreground)]" />}
            </button>
          </div>
          <a href={verificationUri} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
            Open verification page <ExternalLink className="w-3 h-3" />
          </a>
        </div>
        <div className="flex items-center justify-center gap-2 text-xs text-[var(--muted-foreground)]">
          <Loader2 className="w-3 h-3 animate-spin" /> Waiting for authorization...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button onClick={startFlow}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg hover:opacity-90 transition-opacity">
        <LogIn className="w-4 h-4" /> Login with {OAUTH_PROVIDERS[provider]?.name || provider}
      </button>
      {error && <p className="text-xs text-red-400 text-center">{error}</p>}
    </div>
  );
}

// PKCE Authorization Code flow (Codex)
function PKCEFlow({ provider, onSuccess }: { provider: string; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const handler = async (event: MessageEvent) => {
      if (event.data?.type !== 'oauth-callback') return;
      if (event.data.error) { setError(event.data.error); setLoading(false); return; }
      if (event.data.code) {
        const codeVerifier = sessionStorage.getItem('oauth_code_verifier');
        const state = sessionStorage.getItem('oauth_state');
        if (state !== event.data.state) { setError('State mismatch'); setLoading(false); return; }
        try {
          const res = await fetch('/api/settings/oauth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ provider, code: event.data.code, code_verifier: codeVerifier, redirect_uri: `${window.location.origin}/api/settings/oauth/callback` }),
          });
          const data = await res.json();
          if (data.status === 'success') onSuccess();
          else setError(data.error || 'Token exchange failed');
        } catch { setError('Token exchange failed'); }
        setLoading(false);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [provider, onSuccess]);

  const startFlow = async () => {
    setLoading(true); setError('');
    const config = OAUTH_PROVIDERS[provider];
    if (!config?.authorizeUrl || !config.clientId) return;
    const codeVerifier = generateRandomString(64);
    const state = generateRandomString(32);
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    sessionStorage.setItem('oauth_code_verifier', codeVerifier);
    sessionStorage.setItem('oauth_state', state);
    const params = new URLSearchParams({
      response_type: 'code', client_id: config.clientId,
      redirect_uri: `${window.location.origin}/api/settings/oauth/callback`,
      scope: (config.scopes || []).join(' '), state,
      code_challenge: codeChallenge, code_challenge_method: 'S256',
    });
    window.open(`${config.authorizeUrl}?${params}`, 'oauth-popup', 'width=600,height=700');
  };

  return (
    <div className="space-y-2">
      <button onClick={startFlow} disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
        Login with {OAUTH_PROVIDERS[provider]?.name || provider}
      </button>
      {error && <p className="text-xs text-red-400 text-center">{error}</p>}
    </div>
  );
}

// Connected OAuth status
function OAuthConnected({ provider, onDisconnect }: { provider: string; onDisconnect: () => void }) {
  const [disconnecting, setDisconnecting] = useState(false);
  const config = OAUTH_PROVIDERS[provider];
  const handleDisconnect = async () => {
    setDisconnecting(true);
    try { await fetch('/api/settings/oauth/disconnect', { method: 'POST' }); onDisconnect(); } catch { /* ignore */ }
    setDisconnecting(false);
  };
  return (
    <div className="flex items-center justify-between px-3 py-2.5 bg-[var(--secondary)]/50 border border-[var(--border)] rounded-lg">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-green-500" />
        <span className="text-sm">Connected via {config?.name || provider}</span>
      </div>
      <button onClick={handleDisconnect} disabled={disconnecting}
        className="flex items-center gap-1 px-2 py-1 text-xs text-[var(--muted-foreground)] hover:text-red-400 transition-colors">
        {disconnecting ? <Loader2 className="w-3 h-3 animate-spin" /> : <LogOut className="w-3 h-3" />} Disconnect
      </button>
    </div>
  );
}

function AIContent() {
  const { aiSettings, setAISettings, loadSettings } = useSettingsStore();

  const getInitialPreset = () => {
    const p = aiSettings.provider;
    if (p === 'qwen' || p === 'codex' || p === 'openai' || p === 'kimi') return p;
    return 'custom';
  };

  const [selectedPreset, setSelectedPreset] = useState(getInitialPreset());
  const [formData, setFormData] = useState({
    provider: aiSettings.provider,
    baseUrl: aiSettings.baseUrl || '',
    apiKey: '',
    model: aiSettings.model || '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handlePresetChange = (preset: string) => {
    setSelectedPreset(preset);
    const config = PROVIDER_PRESETS[preset];
    if (config) {
      setFormData(prev => ({
        ...prev,
        provider: preset === 'custom' ? 'openai' : preset as AIProvider,
        baseUrl: config.baseUrl,
        model: config.model,
      }));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    await setAISettings({
      provider: formData.provider,
      baseUrl: formData.baseUrl.trim() || undefined,
      apiKey: formData.apiKey.trim() || undefined,
      model: formData.model.trim() || undefined,
    });
    await loadSettings();
    setIsSaving(false);
    setSaved(true);
    setFormData(prev => ({ ...prev, apiKey: '' }));
    setTimeout(() => setSaved(false), 2000);
  };

  const handleOAuthSuccess = async () => {
    await loadSettings();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleDisconnect = async () => { await loadSettings(); };

  const activePreset = PROVIDER_PRESETS[selectedPreset] || PROVIDER_PRESETS.custom;
  const isOAuthOnly = activePreset.oauthOnly;
  const isOAuthConnected = aiSettings.oauthConnected && aiSettings.oauthProvider === selectedPreset;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-1">AI Settings</h2>
        <p className="text-sm text-[var(--muted-foreground)]">Configure AI provider for feature generation</p>
      </div>

      <div className="bg-[var(--secondary)]/30 rounded-lg p-4 border border-[var(--border)] space-y-4">
        {/* Provider selection */}
        <div>
          <label className="text-xs text-[var(--muted-foreground)] block mb-1.5">Provider</label>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(PROVIDER_PRESETS).map(([key, preset]) => {
              const isConnected = aiSettings.oauthConnected && aiSettings.oauthProvider === key;
              return (
                <button key={key} onClick={() => handlePresetChange(key)}
                  className={cn(
                    'relative flex flex-col items-start gap-0.5 px-3 py-2.5 rounded-lg border text-left transition-colors',
                    selectedPreset === key
                      ? 'border-[var(--ring)] bg-[var(--accent)]'
                      : 'border-[var(--border)] bg-[var(--background)] hover:border-[var(--ring)]/50'
                  )}>
                  <span className="text-sm font-medium">{preset.label}</span>
                  <span className="text-[10px] text-[var(--muted-foreground)] leading-tight">{preset.description}</span>
                  {isConnected && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-green-500" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* OAuth-only providers: show login/connected state only */}
        {isOAuthOnly && (
          <div>
            <label className="text-xs text-[var(--muted-foreground)] block mb-1.5">Authentication</label>
            {isOAuthConnected ? (
              <OAuthConnected provider={selectedPreset} onDisconnect={handleDisconnect} />
            ) : selectedPreset === 'codex' ? (
              <PKCEFlow provider={selectedPreset} onSuccess={handleOAuthSuccess} />
            ) : (
              <DeviceCodeFlow provider={selectedPreset} onSuccess={handleOAuthSuccess} />
            )}
          </div>
        )}

        {/* API key config: only for openai and custom */}
        {!isOAuthOnly && (
          <>
            <div>
              <label className="text-xs text-[var(--muted-foreground)] block mb-1">
                Base URL {selectedPreset !== 'custom' && <span className="opacity-60">(auto-filled)</span>}
              </label>
              <input type="text" value={formData.baseUrl}
                onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                placeholder={selectedPreset === 'custom' ? 'http://localhost:11434/v1' : activePreset.baseUrl}
                className="w-full px-3 py-2 text-sm bg-[var(--background)] border border-[var(--border)] rounded-lg outline-none focus:border-[var(--ring)] transition-colors" />
            </div>
            <div>
              <label className="text-xs text-[var(--muted-foreground)] block mb-1">API Key</label>
              <input type="password" value={aiSettings.hasApiKey ? '***' : formData.apiKey}
                onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                placeholder={activePreset.apiKeyPlaceholder}
                className="w-full px-3 py-2 text-sm bg-[var(--background)] border border-[var(--border)] rounded-lg outline-none focus:border-[var(--ring)] transition-colors" />
            </div>
            <div>
              <label className="text-xs text-[var(--muted-foreground)] block mb-1">
                Model {selectedPreset !== 'custom' && <span className="opacity-60">(auto-filled)</span>}
              </label>
              <input type="text" value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                placeholder={selectedPreset === 'custom' ? 'gpt-4o, llama3, mistral, etc.' : activePreset.model}
                className="w-full px-3 py-2 text-sm bg-[var(--background)] border border-[var(--border)] rounded-lg outline-none focus:border-[var(--ring)] transition-colors" />
            </div>
            <button onClick={handleSave} disabled={isSaving}
              className="w-full px-4 py-2 text-sm bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg disabled:opacity-50 transition-colors">
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </>
        )}

        {saved && <div className="text-xs text-green-500 text-center">Settings saved successfully</div>}
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
