'use client';

import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PRDToUserStoriesModal } from '@/components/prd-to-user-stories-modal';
import type { UserStory } from '@/types';

interface PRDToUserStoriesButtonProps {
  projectPath: string;
  onUserStoriesGenerated?: (userStories: UserStory[]) => void;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function PRDToUserStoriesButton({
  projectPath,
  onUserStoriesGenerated,
  variant = 'default',
  size = 'md',
  className
}: PRDToUserStoriesButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleStoriesGenerated = (userStories: UserStory[]) => {
    setIsModalOpen(false);
    if (onUserStoriesGenerated) {
      onUserStoriesGenerated(userStories);
    }
  };

  const sizeClasses = {
    sm: 'text-xs h-8 px-3',
    md: 'text-sm h-10 px-4',
    lg: 'text-base h-12 px-6'
  };

  const variantClasses = {
    default: 'bg-[var(--foreground)] text-[var(--background)] hover:opacity-85',
    ghost: 'hover:bg-[var(--accent)]',
    outline: 'border border-[var(--border)] hover:bg-[var(--accent)]'
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={cn(
          'inline-flex items-center gap-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
        aria-label="Generate user stories from PRD"
      >
        <span>Generate from PRD</span>
      </button>

      <PRDToUserStoriesModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUserStoriesGenerated={handleStoriesGenerated}
        projectPath={projectPath}
      />
    </>
  );
}
