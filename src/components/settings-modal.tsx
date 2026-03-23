'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { X, Keyboard, Info, Github, ExternalLink, FileText, History, Palette, Sparkles, LogIn, LogOut, Loader2, Copy, Check, Plus, Trash2, ChevronUp, ChevronDown, Power, Download } from 'lucide-react';
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

const PROVIDER_PRESETS: Record<string, { label: string; baseUrl: string; model: string; apiKeyPlaceholder: string; description: string; oauthOnly?: boolean; fixedBaseUrl?: boolean }> = {
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
  iflow: {
    label: 'iFlow',
    baseUrl: 'https://apis.iflow.cn/v1',
    model: 'Qwen3-Coder',
    apiKeyPlaceholder: '',
    description: 'Free AI models: Kimi K2, Qwen3, DeepSeek v3',
    oauthOnly: true,
  },
  mistral: {
    label: 'Mistral / Codestral',
    baseUrl: 'https://api.mistral.ai/v1',
    model: 'codestral-latest',
    apiKeyPlaceholder: 'sk-...',
    description: 'Codestral, Mistral Large, Devstral via Mistral API',
    fixedBaseUrl: true,
  },
  openai: {
    label: 'OpenAI Compatible API',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o',
    apiKeyPlaceholder: 'sk-...',
    description: 'OpenAI, Ollama, LM Studio, or any compatible API',
  },
  anthropic: {
    label: 'Anthropic Claude Compatible API',
    baseUrl: 'https://api.anthropic.com',
    model: 'claude-sonnet-4-20250514',
    apiKeyPlaceholder: 'sk-ant-...',
    description: 'Claude Sonnet, Opus, Haiku, or any Anthropic-compatible API',
  },
  gemini: {
    label: 'Google Gemini API',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    model: 'gemini-2.5-flash',
    apiKeyPlaceholder: 'AIza...',
    description: 'Gemini 2.5 Flash/Pro via Google AI Studio',
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
      // Try to open popup, but don't fail if blocked
      try {
        const popup = window.open(data.verification_uri, '_blank', 'noopener');
        if (!popup) {
          // Popup was blocked - user can use the fallback link shown below
          console.warn('Popup blocked - user should click the verification link manually');
        }
      } catch {
        // Popup blocked - fallback link is shown in the polling UI
      }

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
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--foreground)] underline underline-offset-2 hover:opacity-80 transition-opacity">
            Open verification page <ExternalLink className="w-3.5 h-3.5" />
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
        Login with {OAUTH_PROVIDERS[provider]?.name || provider}
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
    if (config.audience) {
      params.set('audience', config.audience);
    }
    const authUrl = `${config.authorizeUrl}?${params}`;
    try {
      const popup = window.open(authUrl, 'oauth-popup', 'width=600,height=700');
      if (!popup) {
        // Popup blocked - navigate directly (callback will redirect back)
        window.location.href = authUrl;
      }
    } catch {
      window.location.href = authUrl;
    }
  };

  return (
    <div className="space-y-2">
      <button onClick={startFlow} disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity">
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
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
        {disconnecting && <Loader2 className="w-3 h-3 animate-spin" />} Disconnect
      </button>
    </div>
  );
}

// Provider config from API
interface ProviderItem {
  id: string;
  provider: string;
  label: string;
  baseUrl: string;
  model: string;
  enabled: boolean;
  priority: number;
  hasApiKey: boolean;
  hasOAuth: boolean;
}

// Single provider row in the list
function ProviderRow({
  item, index, total, autoExpand,
  onToggle, onMoveUp, onMoveDown, onDelete, onOAuthSuccess,
}: {
  item: ProviderItem; index: number; total: number; autoExpand?: boolean;
  onToggle: () => void; onMoveUp: () => void; onMoveDown: () => void;
  onDelete: () => void; onOAuthSuccess: () => void;
}) {
  const [expanded, setExpanded] = useState(autoExpand ?? false);
  useEffect(() => {
    if (autoExpand) setExpanded(true);
  }, [autoExpand]);
  const preset = PROVIDER_PRESETS[item.provider];
  const isOAuth = preset?.oauthOnly;
  const hasAuth = item.hasApiKey || item.hasOAuth;

  return (
    <div className={cn(
      'border rounded-lg transition-colors',
      item.enabled ? 'border-[var(--border)]' : 'border-[var(--border)] opacity-50',
    )}>
      {/* Header row */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        {/* Priority badge */}
        <span className="flex items-center justify-center w-5 h-5 rounded text-[10px] font-mono font-bold bg-[var(--secondary)] text-[var(--muted-foreground)] shrink-0">
          {index + 1}
        </span>

        {/* Provider info */}
        <button onClick={() => setExpanded(!expanded)} className="flex-1 text-left min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium truncate">{item.label}</span>
            {hasAuth && <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />}
            {!hasAuth && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />}
          </div>
          <span className="text-[10px] text-[var(--muted-foreground)] truncate block">{item.model}</span>
        </button>

        {/* Actions */}
        <div className="flex items-center gap-0.5 shrink-0">
          <button onClick={onMoveUp} disabled={index === 0}
            className="p-1 rounded hover:bg-[var(--secondary)] disabled:opacity-30 transition-colors" title="Move up">
            <ChevronUp className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
          </button>
          <button onClick={onMoveDown} disabled={index === total - 1}
            className="p-1 rounded hover:bg-[var(--secondary)] disabled:opacity-30 transition-colors" title="Move down">
            <ChevronDown className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
          </button>
          <button
            onClick={onToggle}
            role="switch"
            aria-checked={item.enabled}
            title={item.enabled ? 'Disable' : 'Enable'}
            className={cn(
              'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
              item.enabled ? 'bg-[var(--foreground)]' : 'bg-[var(--border)]'
            )}
          >
            <span
              className={cn(
                'pointer-events-none inline-block h-4 w-4 rounded-full bg-[var(--background)] shadow-sm ring-0 transition-transform',
                item.enabled ? 'translate-x-4' : 'translate-x-0'
              )}
            />
          </button>
          <button
            onClick={onDelete}
            className="p-1 rounded hover:bg-[var(--secondary)] transition-colors"
            title="Remove provider"
          >
            <Trash2 className="w-3.5 h-3.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)]" />
          </button>
        </div>
      </div>

      {/* Expanded: auth section */}
      {expanded && (
        <div className="px-3 pb-3 pt-1 border-t border-[var(--border)] space-y-2">
          {isOAuth && !item.hasOAuth && (
            item.provider === 'codex'
              ? <PKCEFlow provider={item.provider} onSuccess={onOAuthSuccess} />
              : <DeviceCodeFlow provider={item.provider} onSuccess={onOAuthSuccess} />
          )}
          {isOAuth && item.hasOAuth && (
            <div className="flex items-center justify-between px-2 py-1.5 bg-[var(--secondary)]/50 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-xs">OAuth connected</span>
              </div>
              <button onClick={async () => {
                await fetch(`/api/settings/ai/provider-configs/oauth?providerId=${item.id}`, { method: 'DELETE' });
                onOAuthSuccess();
              }} className="text-[10px] text-[var(--muted-foreground)] hover:text-red-400 transition-colors">
                Disconnect
              </button>
            </div>
          )}
          {!isOAuth && (
            <ProviderApiKeyInput providerId={item.id} hasApiKey={item.hasApiKey} onSaved={onOAuthSuccess} />
          )}
          {!preset?.fixedBaseUrl && (
            <div className="text-[10px] text-[var(--muted-foreground)]">
              Base URL: <span className="font-mono">{item.baseUrl}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// API key input for non-OAuth providers
function ProviderApiKeyInput({ providerId, hasApiKey, onSaved }: { providerId: string; hasApiKey: boolean; onSaved: () => void }) {
  const [apiKey, setApiKey] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!apiKey.trim()) return;
    setSaving(true);
    await fetch('/api/settings/ai/provider-configs', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: providerId, apiKey: apiKey.trim() }),
    });
    setApiKey('');
    setSaving(false);
    onSaved();
  };

  return (
    <div className="flex gap-2">
      <input type="password" value={hasApiKey ? '***' : apiKey}
        onChange={(e) => setApiKey(e.target.value)}
        placeholder="API key"
        className="flex-1 px-2 py-1.5 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg outline-none focus:border-[var(--ring)] transition-colors" />
      <button onClick={handleSave} disabled={saving || (!apiKey.trim() && !hasApiKey)}
        className="px-2 py-1.5 text-xs bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg disabled:opacity-50 transition-colors">
        {saving ? '...' : 'Save'}
      </button>
    </div>
  );
}

// Add OAuth provider dialog - starts OAuth flow directly
function AddOAuthProviderDialog({ onDone, onClose }: { onDone: () => void; onClose: () => void }) {
  const [selected, setSelected] = useState<string | null>(null);

  const oauthPresets = Object.entries(PROVIDER_PRESETS).filter(([, p]) => p.oauthOnly);
  const oauthConfig = selected ? OAUTH_PROVIDERS[selected] : null;
  const useDeviceCode = oauthConfig && !oauthConfig.authorizeUrl;

  return (
    <div className="space-y-3 p-3 bg-[var(--secondary)]/30 rounded-lg border border-[var(--border)]">
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium text-[var(--muted-foreground)]">Add OAuth Provider</div>
        <button onClick={onClose} className="p-0.5 rounded hover:bg-[var(--secondary)] transition-colors">
          <X className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
        </button>
      </div>

      {!selected ? (
        <div className="grid grid-cols-2 gap-1.5">
          {oauthPresets.map(([key, preset]) => (
            <button key={key} onClick={() => setSelected(key)}
              className="flex flex-col items-start px-3 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--background)] hover:border-[var(--ring)]/50 text-left transition-colors">
              <span className="text-xs font-medium">{preset.label}</span>
              <span className="text-[9px] text-[var(--muted-foreground)] leading-tight mt-0.5">{preset.description}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-2 py-1.5 bg-[var(--accent)] rounded-lg">
            <span className="text-xs font-medium">{PROVIDER_PRESETS[selected]?.label}</span>
            <button onClick={() => setSelected(null)} className="ml-auto text-[9px] text-[var(--muted-foreground)] hover:text-[var(--foreground)] underline">
              Change
            </button>
          </div>
          {useDeviceCode ? (
            <DeviceCodeFlow provider={selected} onSuccess={onDone} />
          ) : (
            <PKCEFlow provider={selected} onSuccess={onDone} />
          )}
        </div>
      )}
    </div>
  );
}

// Add API Key provider dialog
function AddApiKeyProviderDialog({ onAdd, onClose }: { onAdd: () => void; onClose: () => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [customModel, setCustomModel] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [error, setError] = useState('');

  const apiKeyPresets = Object.entries(PROVIDER_PRESETS).filter(([, p]) => !p.oauthOnly);

  const handleAdd = async () => {
    if (!selected) return;
    setAdding(true);
    setError('');
    try {
      const preset = PROVIDER_PRESETS[selected];
      const res = await fetch('/api/settings/ai/provider-configs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: selected,
          label: preset.label + (customModel ? ` (${customModel})` : ''),
          baseUrl: customUrl || preset.baseUrl,
          model: customModel || preset.model,
          apiKey: apiKeyInput.trim(),
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setError(errData.error || 'Failed to add provider');
        return;
      }
      onAdd();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add provider');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="space-y-3 p-3 bg-[var(--secondary)]/30 rounded-lg border border-[var(--border)]">
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium text-[var(--muted-foreground)]">Add API Key Provider</div>
        <button onClick={onClose} className="p-0.5 rounded hover:bg-[var(--secondary)] transition-colors">
          <X className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        {apiKeyPresets.map(([key, preset]) => (
          <button key={key} onClick={() => { setSelected(key); setCustomModel(''); setCustomUrl(''); setApiKeyInput(''); setError(''); }}
            className={cn(
              'flex flex-col items-start px-3 py-2.5 rounded-lg border text-left transition-colors',
              selected === key
                ? 'border-[var(--ring)] bg-[var(--accent)]'
                : 'border-[var(--border)] bg-[var(--background)] hover:border-[var(--ring)]/50'
            )}>
            <span className="text-xs font-medium">{preset.label}</span>
            <span className="text-[9px] text-[var(--muted-foreground)] leading-tight mt-0.5">{preset.description}</span>
          </button>
        ))}
      </div>

      {selected && (
        <div className="space-y-2">
          <div>
            <label className="text-[9px] text-[var(--muted-foreground)] block mb-0.5">
              API Key <span className="text-red-400">*</span>
            </label>
            <input type="password" value={apiKeyInput} onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder={PROVIDER_PRESETS[selected]?.apiKeyPlaceholder || 'Enter API key'}
              className="w-full px-2 py-1.5 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg outline-none focus:border-[var(--ring)] transition-colors" />
          </div>
          {!PROVIDER_PRESETS[selected]?.fixedBaseUrl && (
            <div>
              <label className="text-[9px] text-[var(--muted-foreground)] block mb-0.5">
                Base URL <span className="opacity-60">(optional)</span>
              </label>
              <input type="text" value={customUrl} onChange={(e) => setCustomUrl(e.target.value)}
                placeholder={PROVIDER_PRESETS[selected]?.baseUrl || 'https://api.openai.com/v1'}
                className="w-full px-2 py-1.5 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg outline-none focus:border-[var(--ring)]" />
            </div>
          )}
          <div>
            <label className="text-[9px] text-[var(--muted-foreground)] block mb-0.5">
              Model <span className="text-[var(--foreground)]">*</span>
            </label>
            <input type="text" value={customModel} onChange={(e) => setCustomModel(e.target.value)}
              placeholder={PROVIDER_PRESETS[selected]?.model || 'gpt-4o'}
              className="w-full px-2 py-1.5 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg outline-none focus:border-[var(--ring)]" />
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button onClick={handleAdd}
            disabled={!apiKeyInput.trim() || adding || !(customModel || PROVIDER_PRESETS[selected]?.model)}
            className="w-full px-3 py-1.5 text-xs bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg disabled:opacity-50 transition-colors">
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
  const [showAddOAuth, setShowAddOAuth] = useState(false);
  const [showAddApiKey, setShowAddApiKey] = useState(false);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  const handleImportEnv = async () => {
    setImporting(true);
    setImportResult(null);
    try {
      const res = await fetch('/api/settings/ai/provider-configs/import-env', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setImportResult({
          message: data.message,
          type: data.imported?.length > 0 ? 'success' : 'info',
        });
        if (data.imported?.length > 0) loadProviders();
      } else {
        setImportResult({ message: data.error || 'Import failed', type: 'info' });
      }
    } catch {
      setImportResult({ message: 'Network error', type: 'info' });
    }
    setImporting(false);
    setTimeout(() => setImportResult(null), 4000);
  };

  const loadProviders = useCallback(async () => {
    try {
      const res = await fetch('/api/settings/ai/provider-configs');
      if (res.ok) {
        const data = await res.json();
        setProviders(data);
      }
    } catch { /* ignore */ }
    setIsLoading(false);
  }, []);

  useEffect(() => { loadProviders(); }, [loadProviders]);

  const handleToggle = async (id: string, enabled: boolean) => {
    // Optimistic update - toggle immediately in UI
    setProviders(prev => prev.map(p => p.id === id ? { ...p, enabled: !enabled } : p));
    try {
      const res = await fetch('/api/settings/ai/provider-configs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, enabled: !enabled }),
      });
      if (!res.ok) {
        // Revert on failure
        setProviders(prev => prev.map(p => p.id === id ? { ...p, enabled } : p));
      }
    } catch {
      // Revert on error
      setProviders(prev => prev.map(p => p.id === id ? { ...p, enabled } : p));
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const newProviders = [...providers];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newProviders.length) return;

    // Swap priorities
    const reorder = newProviders.map((p, i) => ({
      id: p.id,
      priority: i === index ? newProviders[swapIndex].priority : i === swapIndex ? newProviders[index].priority : p.priority,
    }));

    await fetch('/api/settings/ai/provider-configs', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reorder }),
    });
    loadProviders();
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/settings/ai/provider-configs?id=${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        console.error('Failed to delete provider:', errData.error || res.statusText);
      }
    } catch (err) {
      console.error('Failed to delete provider:', err);
    }
    setConfirmingDeleteId(null);
    loadProviders();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-1">AI Providers</h2>
        <p className="text-sm text-[var(--muted-foreground)]">
          Add multiple providers for load balancing. Higher priority (top) is tried first; failed requests auto-fallback to the next.
        </p>
      </div>

      {/* Provider list */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-4 h-4 animate-spin text-[var(--muted-foreground)]" />
          </div>
        ) : providers.length === 0 ? (
          <div className="text-center py-6 text-sm text-[var(--muted-foreground)]">
            No providers configured. Add one to get started.
          </div>
        ) : (
          providers.map((item, index) => (
            <ProviderRow
              key={item.id}
              item={item}
              index={index}
              total={providers.length}
              autoExpand={false}
              onToggle={() => handleToggle(item.id, item.enabled)}
              onMoveUp={() => handleMove(index, 'up')}
              onMoveDown={() => handleMove(index, 'down')}
              onDelete={() => setConfirmingDeleteId(item.id)}
              onOAuthSuccess={() => loadProviders()}
            />
          ))
        )}
      </div>

      {/* Delete confirmation modal */}
      {confirmingDeleteId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={() => setConfirmingDeleteId(null)} />
          <div className="relative bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-xl p-5 w-[320px] space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div>
              <h3 className="text-sm font-semibold">Remove provider</h3>
              <p className="text-xs text-[var(--muted-foreground)] mt-1 leading-relaxed">
                Are you sure you want to remove <span className="font-medium text-[var(--foreground)]">{providers.find(p => p.id === confirmingDeleteId)?.label || 'this provider'}</span>? This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmingDeleteId(null)}
                className="px-3 py-1.5 text-xs rounded-lg border border-[var(--border)] hover:bg-[var(--secondary)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmingDeleteId)}
                className="px-3 py-1.5 text-xs rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add provider dialogs */}
      {showAddOAuth && (
        <AddOAuthProviderDialog
          onDone={() => { setShowAddOAuth(false); loadProviders(); }}
          onClose={() => setShowAddOAuth(false)}
        />
      )}
      {showAddApiKey && (
        <AddApiKeyProviderDialog
          onAdd={() => { setShowAddApiKey(false); loadProviders(); }}
          onClose={() => setShowAddApiKey(false)}
        />
      )}

      {/* Action buttons */}
      {!showAddOAuth && !showAddApiKey && (
        <div className="flex flex-col gap-1.5">
          <button onClick={() => setShowAddOAuth(true)}
            className="flex items-center gap-2.5 px-3 py-2 text-xs border border-dashed border-[var(--border)] rounded-lg hover:border-[var(--ring)]/50 hover:bg-[var(--secondary)]/30 transition-colors text-[var(--muted-foreground)]">
            <LogIn className="w-3.5 h-3.5" />
            OAuth Login
          </button>
          <button onClick={() => setShowAddApiKey(true)}
            className="flex items-center gap-2.5 px-3 py-2 text-xs border border-dashed border-[var(--border)] rounded-lg hover:border-[var(--ring)]/50 hover:bg-[var(--secondary)]/30 transition-colors text-[var(--muted-foreground)]">
            <Plus className="w-3.5 h-3.5" />
            API Key
          </button>
          <button onClick={handleImportEnv} disabled={importing}
            className="flex items-center gap-2.5 px-3 py-2 text-xs border border-dashed border-[var(--border)] rounded-lg hover:border-[var(--ring)]/50 hover:bg-[var(--secondary)]/30 transition-colors text-[var(--muted-foreground)] disabled:opacity-50"
            title="Import from environment variables">
            {importing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            Import from environment
          </button>
        </div>
      )}

      {/* Import result message */}
      {importResult && (
        <div className={cn(
          'text-xs text-center py-1.5 px-3 rounded-lg',
          importResult.type === 'success'
            ? 'text-green-500 bg-green-500/10'
            : 'text-[var(--muted-foreground)] bg-[var(--secondary)]/30'
        )}>
          {importResult.message}
        </div>
      )}
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

const MENU_ITEMS: { id: SettingsSection; label: string }[] = [
  { id: 'ai', label: 'AI Settings' },
  { id: 'shortcuts', label: 'Shortcuts' },
  { id: 'appearance', label: 'Appearance' },
  { id: 'about', label: 'About' },
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
      <div className="relative w-[90vw] max-w-[900px] h-[85vh] max-h-[900px] bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
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
