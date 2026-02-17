'use client';

import { BaseModal } from '../base/base-modal';
import type { BaseModalProps } from '../base/types';

// Placeholder modal for stages not yet implemented
export function PlaceholderModal({ feature, onClose, onStageChange, stageLabel }: BaseModalProps & { stageLabel: string }) {
  return (
    <BaseModal
      feature={feature}
      onClose={onClose}
      onStageChange={onStageChange}
      showNavigation
    >
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-[var(--foreground)] mb-2">
            {stageLabel} Stage
          </h2>
          <p className="text-[var(--muted-foreground)]">
            This stage is coming soon.
          </p>
        </div>
      </div>
    </BaseModal>
  );
}

// Convenience functions to create placeholder modals
export function createPlaceholderModal(stageLabel: string) {
  return function PlaceholderModal({ feature, onClose, onStageChange }: BaseModalProps) {
    return (
      <BaseModal
        feature={feature}
        onClose={onClose}
        onStageChange={onStageChange}
        showNavigation
      >
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-[var(--foreground)] mb-2">
              {stageLabel} Stage
            </h2>
            <p className="text-[var(--muted-foreground)]">
              This stage is coming soon.
            </p>
          </div>
        </div>
      </BaseModal>
    );
  };
}
