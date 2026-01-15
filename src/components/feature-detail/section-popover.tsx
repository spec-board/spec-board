'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface SectionPopoverProps {
  children: React.ReactNode;
  content: React.ReactNode;
  showDelay?: number;
  hideDelay?: number;
  side?: 'left' | 'right';
  disabled?: boolean;
}

/**
 * SectionPopover - Hover-triggered popover for progressive disclosure
 * Shows detailed metrics on hover with configurable delays
 *
 * Design decisions:
 * - 400ms show delay prevents accidental triggers during navigation (desktop only)
 * - 150ms hide delay allows mouse to move from trigger to popover (desktop only)
 * - Supports both hover and keyboard focus for accessibility
 * - Touch devices: tap-to-toggle behavior without delays
 */
export function SectionPopover({
  children,
  content,
  showDelay = 400,
  hideDelay = 150,
  side = 'right',
  disabled = false,
}: SectionPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const showTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const hideTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const triggerRef = useRef<HTMLDivElement>(null);

  // Detect touch device on mount
  useEffect(() => {
    const hasTouchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    setIsTouchDevice(hasTouchSupport);
  }, []);

  const clearTimeouts = useCallback(() => {
    if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
  }, []);

  const showPopover = useCallback(() => {
    if (disabled) return;
    clearTimeouts();
    // On touch devices, show immediately without delay
    if (isTouchDevice) {
      setIsOpen(true);
    } else {
      showTimeoutRef.current = setTimeout(() => setIsOpen(true), showDelay);
    }
  }, [clearTimeouts, showDelay, disabled, isTouchDevice]);

  const hidePopover = useCallback(() => {
    clearTimeouts();
    // On touch devices, hide immediately without delay
    if (isTouchDevice) {
      setIsOpen(false);
    } else {
      hideTimeoutRef.current = setTimeout(() => setIsOpen(false), hideDelay);
    }
  }, [clearTimeouts, hideDelay, isTouchDevice]);

  const cancelHide = useCallback(() => {
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
  }, []);

  // Handle tap-to-toggle for touch devices
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (isTouchDevice && !disabled) {
      e.stopPropagation();
      setIsOpen(prev => !prev);
    }
  }, [isTouchDevice, disabled]);

  // Handle escape key to close popover
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && isOpen) {
      setIsOpen(false);
    }
  }, [isOpen]);

  // Close popover when clicking outside on touch devices
  useEffect(() => {
    if (!isTouchDevice || !isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isTouchDevice, isOpen]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeouts();
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [clearTimeouts, handleKeyDown]);

  if (disabled) {
    return <>{children}</>;
  }

  return (
    <div
      ref={triggerRef}
      className="relative"
      onMouseEnter={!isTouchDevice ? showPopover : undefined}
      onMouseLeave={!isTouchDevice ? hidePopover : undefined}
      onFocus={!isTouchDevice ? showPopover : undefined}
      onBlur={!isTouchDevice ? hidePopover : undefined}
      onClick={handleClick}
    >
      {children}
      {isOpen && (
        <div
          className={cn(
            'absolute z-50 top-0 bg-[var(--card)] border border-[var(--border)] shadow-lg min-w-[200px]',
            side === 'right' ? 'left-full ml-2' : 'right-full mr-2',
            // Ensure touch-friendly positioning on mobile
            isTouchDevice && 'max-w-[280px]'
          )}
          style={{
            borderRadius: 'var(--radius)',
            padding: 'var(--space-1-5)',
          }}
          onMouseEnter={!isTouchDevice ? cancelHide : undefined}
          onMouseLeave={!isTouchDevice ? hidePopover : undefined}
          role="tooltip"
          onClick={(e) => e.stopPropagation()}
        >
          {content}
        </div>
      )}
    </div>
  );
}
