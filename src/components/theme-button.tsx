'use client';

import { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Monitor, ChevronDown } from 'lucide-react';
import { useSettingsStore, type Theme } from '@/lib/settings-store';

const themeOptions: { value: Theme; icon: typeof Sun; label: string }[] = [
  { value: 'light', icon: Sun, label: 'Light' },
  { value: 'dark', icon: Moon, label: 'Dark' },
  { value: 'system', icon: Monitor, label: 'System' },
];

export function ThemeButton() {
  const { theme, setTheme } = useSettingsStore();
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) closeDropdown();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const openDropdown = () => {
    setOpen(true);
    requestAnimationFrame(() => setVisible(true));
  };

  const closeDropdown = () => {
    setVisible(false);
    setTimeout(() => setOpen(false), 150);
  };

  const current = themeOptions.find(o => o.value === theme) || themeOptions[0];
  const CurrentIcon = current.icon;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => open ? closeDropdown() : openDropdown()}
        className="inline-flex items-center gap-1 px-1.5 py-1 rounded-md hover:bg-[var(--secondary)] transition-colors duration-150"
        aria-label={`Theme: ${current.label}`}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <CurrentIcon className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
        <ChevronDown className={`w-2.5 h-2.5 text-[var(--muted-foreground)] transition-transform duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          className={`absolute right-0 top-full mt-1 min-w-[110px] rounded-lg border border-[var(--border)] bg-[var(--card)] shadow-md z-50 p-0.5 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] origin-top-right ${
            visible
              ? 'opacity-100 scale-100 translate-y-0'
              : 'opacity-0 scale-90 -translate-y-1.5'
          }`}
        >
          {themeOptions.map((opt, i) => {
            const Icon = opt.icon;
            const isActive = theme === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => { setTheme(opt.value); closeDropdown(); }}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-md transition-all duration-150 ease-out ${
                  isActive
                    ? 'text-[var(--foreground)] bg-[var(--accent)] font-medium'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)]'
                }`}
                style={{
                  opacity: visible ? 1 : 0,
                  transform: visible ? 'translateY(0)' : 'translateY(-4px)',
                  transition: `opacity 150ms ease-out ${i * 40}ms, transform 150ms ease-out ${i * 40}ms`,
                }}
              >
                <Icon className="w-3.5 h-3.5" />
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
