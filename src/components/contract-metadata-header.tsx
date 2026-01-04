'use client';

import { Calendar, FileCode, MapPin, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ContractMetadata, ContractType } from '@/types';

interface ContractMetadataHeaderProps {
  metadata: ContractMetadata;
  contractType: ContractType;
  className?: string;
}

/**
 * ContractMetadataHeader Component (T017-T021)
 *
 * Displays extracted metadata in a structured format with type badges.
 * Gracefully handles missing optional fields.
 */
export function ContractMetadataHeader({
  metadata,
  contractType,
  className,
}: ContractMetadataHeaderProps) {
  // Check if we have any metadata to display (T020)
  const hasMetadata =
    metadata.feature ||
    metadata.date ||
    metadata.type ||
    metadata.endpoint ||
    metadata.basePath ||
    metadata.location;

  if (!hasMetadata) {
    return null;
  }

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-3 p-3 mb-4 rounded-lg',
        'bg-[var(--secondary)]/20 border border-[var(--border)]',
        className
      )}
    >
      {/* Contract Type Badge (T018) */}
      <ContractTypeBadge type={contractType} />

      {/* Feature name */}
      {metadata.feature && (
        <MetadataItem
          icon={<FileCode className="w-3.5 h-3.5" />}
          label="Feature"
          value={metadata.feature}
        />
      )}

      {/* Date */}
      {metadata.date && (
        <MetadataItem
          icon={<Calendar className="w-3.5 h-3.5" />}
          label="Date"
          value={metadata.date}
        />
      )}

      {/* Endpoint - displayed prominently for API contracts (T021) */}
      {metadata.endpoint && (
        <MetadataItem
          icon={<Globe className="w-3.5 h-3.5" />}
          label="Endpoint"
          value={metadata.endpoint}
          prominent
        />
      )}

      {/* Base Path */}
      {metadata.basePath && (
        <MetadataItem
          icon={<Globe className="w-3.5 h-3.5" />}
          label="Base Path"
          value={metadata.basePath}
          prominent
        />
      )}

      {/* Location - displayed prominently for Component contracts (T021) */}
      {metadata.location && (
        <MetadataItem
          icon={<MapPin className="w-3.5 h-3.5" />}
          label="Location"
          value={metadata.location}
          prominent
        />
      )}
    </div>
  );
}

/**
 * Contract Type Badge (T018)
 *
 * Visual badge indicating API, Component, or Unknown contract type.
 */
function ContractTypeBadge({ type }: { type: ContractType }) {
  const styles: Record<ContractType, string> = {
    api: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    component: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    unknown: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  };

  const labels: Record<ContractType, string> = {
    api: 'API',
    component: 'Component',
    unknown: 'Contract',
  };

  return (
    <span
      className={cn(
        'px-2 py-0.5 text-xs font-medium rounded border',
        styles[type]
      )}
    >
      {labels[type]}
    </span>
  );
}

/**
 * Metadata Item
 *
 * Single metadata field with icon, label, and value.
 */
function MetadataItem({
  icon,
  label,
  value,
  prominent = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  prominent?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-1.5 text-sm',
        prominent && 'flex-1 min-w-[200px]'
      )}
    >
      <span className="text-[var(--muted-foreground)]">{icon}</span>
      <span className="text-[var(--muted-foreground)]">{label}:</span>
      <span
        className={cn(
          'font-mono',
          prominent
            ? 'text-[var(--foreground)] font-medium'
            : 'text-[var(--muted-foreground)]'
        )}
      >
        {value}
      </span>
    </div>
  );
}
