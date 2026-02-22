'use client';

import { useRef } from 'react';
import { cn } from '@/lib/utils';
import type { DocumentSelectorProps } from './types';

// Define which docs are main vs secondary
const MAIN_DOCS = ['spec', 'plan', 'tasks', 'clarifications'];
const SECONDARY_DOCS = ['research', 'data-model', 'quickstart', 'contract', 'checklist', 'analysis'];

export function DocumentSelector({ options, selected, onChange }: DocumentSelectorProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Split options into main and secondary
  const mainOptions = options.filter(o => MAIN_DOCS.includes(o.type));
  // Show ALL secondary options (even without content) so users know what can be generated
  const secondaryOptions = options.filter(o => SECONDARY_DOCS.includes(o.type));

  // Handle keyboard navigation for tabs
  const allOptions = options;
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const currentIndex = allOptions.findIndex(o => o.type === selected);

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const nextIndex = (currentIndex + 1) % allOptions.length;
      onChange(allOptions[nextIndex].type);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prevIndex = currentIndex === 0 ? allOptions.length - 1 : currentIndex - 1;
      onChange(allOptions[prevIndex].type);
    }
  };

  const renderTab = (option: typeof options[0], isSecondary = false) => {
    const isAvailable = option.available;
    return (
      <button
        key={option.type}
        onClick={() => isAvailable && onChange(option.type)}
        disabled={!isAvailable}
        role="tab"
        aria-selected={option.type === selected}
        aria-controls={`panel-${option.type}`}
        aria-disabled={!isAvailable}
        className={cn(
          'text-sm font-medium rounded-md transition-colors',
          isSecondary 
            ? 'px-2 py-1 text-xs' 
            : 'px-3 py-1.5',
          'focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-1',
          option.type === selected
            ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
            : isAvailable
              ? 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]'
              : 'text-[var(--muted-foreground)] opacity-40 cursor-not-allowed'
        )}
      >
        {option.label}
        {!isAvailable && <span className="ml-1 text-xs">○</span>}
      </button>
    );
  };

  return (
    <div className="space-y-1">
      {/* Main docs row */}
      <div
        ref={containerRef}
        className="flex items-center gap-1 overflow-x-auto"
        onKeyDown={handleKeyDown}
        role="tablist"
        aria-label="Main document tabs"
      >
        {mainOptions.map(opt => renderTab(opt))}
      </div>

      {/* Secondary docs row - only show if there are available secondary options */}
      {secondaryOptions.length > 0 && (
        <div
          className="flex items-center gap-1 overflow-x-auto"
          role="tablist"
          aria-label="Secondary document tabs"
        >
          {secondaryOptions.map(opt => renderTab(opt, true))}
        </div>
      )}

      {allOptions.length === 0 && (
        <span className="text-sm text-[var(--muted-foreground)] italic">
          No documents available
        </span>
      )}
    </div>
  );
}
