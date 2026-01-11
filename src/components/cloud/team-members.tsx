'use client';

/**
 * Team Members List (T058)
 * Displays and manages project team members
 */

import { useState, useEffect } from 'react';
import {
  Users,
  User,
  Crown,
  Shield,
  Eye,
  Edit3,
  Loader2,
  UserMinus,
  MoreVertical,
} from 'lucide-react';
import type { MemberRole } from '@/types';
import { RoleSelector } from './role-selector';

interface TeamMember {
  id: string;
  userId: string;
  role: MemberRole;
  joinedAt: string;
  lastSyncAt: string | null;
  user: {
    id: string;
    name: string | null;
    email: string;
    avatarUrl: string | null;
  };
}

interface TeamMembersProps {
  projectId: string;
  ownerId: string;
  currentUserId: string;
  currentUserRole: MemberRole;
  onMemberRemoved?: (userId: string) => void;
  onRoleChanged?: (userId: string, newRole: MemberRole) => void;
}

export function TeamMembers({
  projectId,
  ownerId,
  currentUserId,
  currentUserRole,
  onMemberRemoved,
  onRoleChanged,
}: TeamMembersProps) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);
  const [removingMember, setRemovingMember] = useState<string | null>(null);

  const isAdmin = currentUserRole === 'ADMIN' || currentUserId === ownerId;

  useEffect(() => {
    fetchMembers();
  }, [projectId]);

  const fetchMembers = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/cloud-projects/${projectId}/members`);

      if (!response.ok) {
        throw new Error('Failed to fetch team members');
      }

      const data = await response.json();
      setMembers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: MemberRole) => {
    setUpdatingRole(userId);
    setActionMenuOpen(null);

    try {
      const response = await fetch(
        `/api/cloud-projects/${projectId}/members/${userId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: newRole }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update role');
      }

      // Update local state
      setMembers((prev) =>
        prev.map((m) => (m.userId === userId ? { ...m, role: newRole } : m))
      );

      onRoleChanged?.(userId, newRole);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update role');
    } finally {
      setUpdatingRole(null);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) {
      return;
    }

    setRemovingMember(userId);
    setActionMenuOpen(null);

    try {
      const response = await fetch(
        `/api/cloud-projects/${projectId}/members/${userId}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to remove member');
      }

      // Update local state
      setMembers((prev) => prev.filter((m) => m.userId !== userId));
      onMemberRemoved?.(userId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove member');
    } finally {
      setRemovingMember(null);
    }
  };

  const getRoleIcon = (role: MemberRole, isOwner: boolean) => {
    if (isOwner) return <Crown className="w-4 h-4 text-yellow-500" />;
    switch (role) {
      case 'ADMIN':
        return <Shield className="w-4 h-4 text-blue-500" />;
      case 'EDIT':
        return <Edit3 className="w-4 h-4 text-green-500" />;
      case 'VIEW':
        return <Eye className="w-4 h-4 text-[var(--muted-foreground)]" />;
    }
  };

  const formatLastSync = (dateString: string | null) => {
    if (!dateString) return 'Never synced';

    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-[var(--muted-foreground)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Users className="w-5 h-5 text-[var(--muted-foreground)]" />
        <h3 className="font-medium">Team Members</h3>
        <span className="text-sm text-[var(--muted-foreground)]">
          ({members.length})
        </span>
      </div>

      {/* Members List */}
      <div className="space-y-2">
        {members.map((member) => {
          const isOwner = member.userId === ownerId;
          const isSelf = member.userId === currentUserId;
          const canManage = isAdmin && !isOwner && !isSelf;

          return (
            <div
              key={member.id}
              className="flex items-center gap-3 p-3 bg-[var(--secondary)] rounded-lg"
            >
              {/* Avatar */}
              <div className="flex-shrink-0">
                {member.user.avatarUrl ? (
                  <img
                    src={member.user.avatarUrl}
                    alt={member.user.name || member.user.email}
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[var(--card)] flex items-center justify-center">
                    <User className="w-5 h-5 text-[var(--muted-foreground)]" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium truncate">
                    {member.user.name || member.user.email.split('@')[0]}
                  </p>
                  {isSelf && (
                    <span className="text-xs px-1.5 py-0.5 bg-blue-500/10 text-blue-500 rounded">
                      You
                    </span>
                  )}
                </div>
                <p className="text-sm text-[var(--muted-foreground)] truncate">
                  {member.user.email}
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Last sync: {formatLastSync(member.lastSyncAt)}
                </p>
              </div>

              {/* Role Badge */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-2 py-1 bg-[var(--card)] rounded">
                  {getRoleIcon(member.role, isOwner)}
                  <span className="text-sm">
                    {isOwner ? 'Owner' : member.role}
                  </span>
                </div>

                {/* Actions Menu */}
                {canManage && (
                  <div className="relative">
                    <button
                      onClick={() =>
                        setActionMenuOpen(
                          actionMenuOpen === member.userId ? null : member.userId
                        )
                      }
                      className="p-1.5 hover:bg-[var(--card)] rounded transition-colors"
                      disabled={updatingRole === member.userId || removingMember === member.userId}
                    >
                      {updatingRole === member.userId || removingMember === member.userId ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <MoreVertical className="w-4 h-4" />
                      )}
                    </button>

                    {actionMenuOpen === member.userId && (
                      <>
                        {/* Backdrop */}
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setActionMenuOpen(null)}
                        />

                        {/* Menu */}
                        <div className="absolute right-0 top-full mt-1 z-20 w-48 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg overflow-hidden">
                          <div className="p-2 border-b border-[var(--border)]">
                            <p className="text-xs text-[var(--muted-foreground)] mb-2">
                              Change role
                            </p>
                            <RoleSelector
                              currentRole={member.role}
                              onChange={(role) => handleRoleChange(member.userId, role)}
                              disabled={updatingRole === member.userId}
                            />
                          </div>
                          <button
                            onClick={() => handleRemoveMember(member.userId)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
                          >
                            <UserMinus className="w-4 h-4" />
                            Remove member
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
