'use client';

/**
 * Role Selector Component (T059)
 * Dropdown for selecting member roles
 */

import { Shield, Edit3, Eye, Check } from 'lucide-react';
import type { MemberRole } from '@/types';

interface RoleSelectorProps {
  currentRole: MemberRole;
  onChange: (role: MemberRole) => void;
  disabled?: boolean;
  excludeRoles?: MemberRole[];
}

const ROLES: Array<{
  value: MemberRole;
  label: string;
  description: string;
  icon: typeof Shield;
  color: string;
}> = [
  {
    value: 'ADMIN',
    label: 'Admin',
    description: 'Full access, can manage members',
    icon: Shield,
    color: 'text-blue-500',
  },
  {
    value: 'EDIT',
    label: 'Editor',
    description: 'Can push and pull specs',
    icon: Edit3,
    color: 'text-green-500',
  },
  {
    value: 'VIEW',
    label: 'Viewer',
    description: 'Read-only access',
    icon: Eye,
    color: 'text-[var(--muted-foreground)]',
  },
];

export function RoleSelector({
  currentRole,
  onChange,
  disabled = false,
  excludeRoles = [],
}: RoleSelectorProps) {
  const availableRoles = ROLES.filter(
    (role) => !excludeRoles.includes(role.value)
  );

  return (
    <div className="space-y-1">
      {availableRoles.map((role) => {
        const Icon = role.icon;
        const isSelected = currentRole === role.value;

        return (
          <button
            key={role.value}
            onClick={() => onChange(role.value)}
            disabled={disabled || isSelected}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left ${
              isSelected
                ? 'bg-[var(--secondary)] cursor-default'
                : 'hover:bg-[var(--secondary)]'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Icon className={`w-4 h-4 ${role.color}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{role.label}</p>
              <p className="text-xs text-[var(--muted-foreground)]">
                {role.description}
              </p>
            </div>
            {isSelected && (
              <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
            )}
          </button>
        );
      })}
    </div>
  );
}
