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
        className="btn-icon flex items-center gap-1"
        aria-label={`Theme: ${current.label}`}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <CurrentIcon className="w-4 h-4" />
        <ChevronDown className={`w-3 h-3 opacity-60 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          className={`absolute right-0 top-full mt-1.5 min-w-[130px] rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-lg z-50 py-1 transition-all duration-150 ease-out origin-top-right ${
            visible
              ? 'opacity-100 scale-100 translate-y-0'
              : 'opacity-0 scale-95 -translate-y-1'
          }`}
        >
          {themeOptions.map((opt, i) => {
            const Icon = opt.icon;
            const isActive = theme === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => { setTheme(opt.value); closeDropdown(); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-all duration-100 ${
                  isActive
                    ? 'text-[var(--foreground)] bg-[var(--accent)]'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)]'
                }`}
                style={{ transitionDelay: visible ? `${i * 30}ms` : '0ms' }}
              >
                <Icon className="w-4 h-4" />
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
