import Redis from 'ioredis';

// Check if Redis is available
export const isRedisAvailable = () => {
  return !!process.env.REDIS_URL;
};

// Create Redis client for BullMQ
const createRedisClient = () => {
  if (!process.env.REDIS_URL) {
    throw new Error('REDIS_URL environment variable is not set. Queue functionality is disabled.');
  }
  return new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null, // Required for BullMQ
    lazyConnect: true, // Don't connect immediately
  });
};

// Singleton Redis connection
let redisClient: Redis | null = null;

export const getRedisClient = () => {
  if (!isRedisAvailable()) {
    throw new Error('Redis is not configured. Set REDIS_URL to enable queue functionality.');
  }
  if (!redisClient) {
    redisClient = createRedisClient();
  }
  return redisClient;
};

// Close Redis connection
export const closeRedis = async () => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
};
