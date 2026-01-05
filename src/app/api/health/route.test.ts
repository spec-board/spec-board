import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';

// Mock Prisma client
vi.mock('@/lib/prisma', () => ({
  default: {
    $queryRaw: vi.fn(),
  },
}));

import prisma from '@/lib/prisma';

describe('/api/health', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return healthy status when database is connected', async () => {
    // Mock successful database query
    vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([{ '?column?': 1 }]);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('healthy');
    expect(data.timestamp).toBeDefined();
    expect(typeof data.timestamp).toBe('string');
  });

  it('should return unhealthy status when database connection fails', async () => {
    // Mock database connection failure
    vi.mocked(prisma.$queryRaw).mockRejectedValueOnce(new Error('Connection refused'));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.status).toBe('unhealthy');
    expect(data.error).toBe('Database connection failed');
    expect(data.timestamp).toBeDefined();
  });

  it('should return valid ISO timestamp', async () => {
    vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([{ '?column?': 1 }]);

    const response = await GET();
    const data = await response.json();

    // Verify timestamp is valid ISO format
    const timestamp = new Date(data.timestamp);
    expect(timestamp.toISOString()).toBe(data.timestamp);
  });
});
