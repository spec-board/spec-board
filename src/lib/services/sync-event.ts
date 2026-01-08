/**
 * SyncEventService (T061)
 * Business logic for sync event logging and activity tracking
 */

import prisma from '@/lib/prisma';
import type { SyncEventType } from '@/types';

// ============================================
// Types
// ============================================

export interface SyncEventRecord {
  id: string;
  cloudProjectId: string;
  userId: string;
  eventType: SyncEventType;
  featuresAffected: string[];
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    avatarUrl: string | null;
  };
}

export interface ActivityFeedResult {
  projectId: string;
  events: SyncEventRecord[];
  totalEvents: number;
  hasMore: boolean;
}

export interface LogEventInput {
  projectId: string;
  userId: string;
  eventType: SyncEventType;
  featuresAffected: string[];
}

// ============================================
// Service
// ============================================

export class SyncEventService {
  /**
   * Log a sync event
   */
  static async logEvent(input: LogEventInput): Promise<SyncEventRecord> {
    const { projectId, userId, eventType, featuresAffected } = input;

    const event = await prisma.syncEvent.create({
      data: {
        cloudProjectId: projectId,
        userId,
        eventType,
        featuresAffected,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    return {
      id: event.id,
      cloudProjectId: event.cloudProjectId,
      userId: event.userId,
      eventType: event.eventType as SyncEventType,
      featuresAffected: event.featuresAffected,
      createdAt: event.createdAt.toISOString(),
      user: {
        id: event.user.id,
        name: event.user.name,
        email: event.user.email,
        avatarUrl: event.user.avatarUrl,
      },
    };
  }

  /**
   * Get activity feed for a project
   */
  static async getActivityFeed(
    projectId: string,
    options: { limit?: number; offset?: number; eventTypes?: SyncEventType[] } = {}
  ): Promise<ActivityFeedResult> {
    const { limit = 20, offset = 0, eventTypes } = options;

    const whereClause: {
      cloudProjectId: string;
      eventType?: { in: string[] };
    } = {
      cloudProjectId: projectId,
    };

    if (eventTypes && eventTypes.length > 0) {
      whereClause.eventType = { in: eventTypes };
    }

    const [events, totalEvents] = await Promise.all([
      prisma.syncEvent.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit + 1, // Fetch one extra to check if there are more
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
      }),
      prisma.syncEvent.count({ where: whereClause }),
    ]);

    const hasMore = events.length > limit;
    const resultEvents = hasMore ? events.slice(0, limit) : events;

    return {
      projectId,
      events: resultEvents.map((e) => ({
        id: e.id,
        cloudProjectId: e.cloudProjectId,
        userId: e.userId,
        eventType: e.eventType as SyncEventType,
        featuresAffected: e.featuresAffected,
        createdAt: e.createdAt.toISOString(),
        user: {
          id: e.user.id,
          name: e.user.name,
          email: e.user.email,
          avatarUrl: e.user.avatarUrl,
        },
      })),
      totalEvents,
      hasMore,
    };
  }

  /**
   * Get recent activity for a user across all their projects
   */
  static async getUserActivity(
    userId: string,
    options: { limit?: number } = {}
  ): Promise<SyncEventRecord[]> {
    const { limit = 10 } = options;

    // Get projects user is a member of
    const memberships = await prisma.projectMember.findMany({
      where: { userId },
      select: { cloudProjectId: true },
    });

    const projectIds = memberships.map((m) => m.cloudProjectId);

    if (projectIds.length === 0) {
      return [];
    }

    const events = await prisma.syncEvent.findMany({
      where: {
        cloudProjectId: { in: projectIds },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    return events.map((e) => ({
      id: e.id,
      cloudProjectId: e.cloudProjectId,
      userId: e.userId,
      eventType: e.eventType as SyncEventType,
      featuresAffected: e.featuresAffected,
      createdAt: e.createdAt.toISOString(),
      user: {
        id: e.user.id,
        name: e.user.name,
        email: e.user.email,
        avatarUrl: e.user.avatarUrl,
      },
    }));
  }

  /**
   * Get activity summary for a project (counts by event type)
   */
  static async getActivitySummary(
    projectId: string,
    options: { since?: Date } = {}
  ): Promise<Record<SyncEventType, number>> {
    const { since } = options;

    const whereClause: {
      cloudProjectId: string;
      createdAt?: { gte: Date };
    } = {
      cloudProjectId: projectId,
    };

    if (since) {
      whereClause.createdAt = { gte: since };
    }

    const events = await prisma.syncEvent.groupBy({
      by: ['eventType'],
      where: whereClause,
      _count: { eventType: true },
    });

    const summary: Record<SyncEventType, number> = {
      PUSH: 0,
      PULL: 0,
      CONFLICT_DETECTED: 0,
      CONFLICT_RESOLVED: 0,
    };

    for (const event of events) {
      summary[event.eventType as SyncEventType] = event._count.eventType;
    }

    return summary;
  }
}
