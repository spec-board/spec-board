'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DocumentSelectorProps } from './types';

export function DocumentSelector({ options, selected, onChange }: DocumentSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Get selected option label
  const selectedOption = options.find(o => o.type === selected);
  const availableOptions = options.filter(o => o.available);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen(!isOpen);
    } else if (e.key === 'ArrowDown' && isOpen) {
      e.preventDefault();
      const currentIndex = availableOptions.findIndex(o => o.type === selected);
      const nextIndex = (currentIndex + 1) % availableOptions.length;
      onChange(availableOptions[nextIndex].type);
    } else if (e.key === 'ArrowUp' && isOpen) {
      e.preventDefault();
      const currentIndex = availableOptions.findIndex(o => o.type === selected);
      const prevIndex = currentIndex === 0 ? availableOptions.length - 1 : currentIndex - 1;
      onChange(availableOptions[prevIndex].type);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-md border transition-colors',
          'bg-white border-gray-200 hover:border-gray-300',
          'text-sm font-medium text-gray-700',
          isOpen && 'border-blue-400 ring-1 ring-blue-100'
        )}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span>Document:</span>
        <span className="text-blue-600">{selectedOption?.label || 'Select'}</span>
        <ChevronDown className={cn(
          'w-4 h-4 text-gray-400 transition-transform',
          isOpen && 'rotate-180'
        )} />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div
          className={cn(
            'absolute top-full left-0 mt-1 z-50',
            'bg-white rounded-md shadow-lg border border-gray-200',
            'py-1 min-w-[160px]'
          )}
          role="listbox"
        >
          {availableOptions.map(option => (
            <button
              key={option.type}
              onClick={() => {
                onChange(option.type);
                setIsOpen(false);
              }}
              className={cn(
                'w-full px-3 py-2 text-left text-sm flex items-center gap-2',
                'hover:bg-gray-50 transition-colors',
                option.type === selected && 'bg-blue-50 text-blue-700'
              )}
              role="option"
              aria-selected={option.type === selected}
            >
              <span className="flex-1">{option.label}</span>
              {option.type === selected && (
                <Check className="w-4 h-4 text-blue-600" />
              )}
            </button>
          ))}

          {availableOptions.length === 0 && (
            <div className="px-3 py-2 text-sm text-gray-400 italic">
              No documents available
            </div>
          )}
        </div>
      )}
    </div>
  );
}
