import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock getAISettings
vi.mock('./settings', () => ({
  getAISettings: vi.fn().mockResolvedValue({
    provider: 'openai',
    apiKey: 'test-api-key',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o'
  }),
  getAppSettings: vi.fn().mockResolvedValue({
    language: 'en'
  })
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Import after mocks
import { AIService } from './client';

describe('AIService Retry Logic', () => {
  let aiService: AIService;

  beforeEach(() => {
    vi.clearAllMocks();
    aiService = new AIService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('callAPI with rate limit handling', () => {
    it('should succeed on first request when no rate limit', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          choices: [{ message: { content: 'Test response' } }]
        })
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await (aiService as any).callAPI('test prompt');

      expect(result).toBe('Test response');
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should retry on 429 status with retry-after header', async () => {
      const rateLimitedResponse = {
        status: 429,
        headers: new Headers({ 'retry-after': '1' }),
        text: vi.fn().mockResolvedValue('Rate limited'),
        ok: false
      };

      const successResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          choices: [{ message: { content: 'Success after retry' } }]
        })
      };

      mockFetch
        .mockResolvedValueOnce(rateLimitedResponse)
        .mockResolvedValueOnce(successResponse);

      const sleepSpy = vi.spyOn(aiService as any, 'sleep');

      const result = await (aiService as any).callAPI('test prompt');

      expect(result).toBe('Success after retry');
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(sleepSpy).toHaveBeenCalledWith(1000); // 1 second from retry-after
    });

    it('should use exponential backoff when no retry-after header', async () => {
      const rateLimitedResponse = {
        status: 429,
        headers: new Headers({}),
        text: vi.fn().mockResolvedValue('Rate limited'),
        ok: false
      };

      const successResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          choices: [{ message: { content: 'Success after backoff' } }]
        })
      };

      mockFetch
        .mockResolvedValueOnce(rateLimitedResponse)
        .mockResolvedValueOnce(successResponse);

      const sleepSpy = vi.spyOn(aiService as any, 'sleep');

      const result = await (aiService as any).callAPI('test prompt');

      expect(result).toBe('Success after backoff');
      expect(mockFetch).toHaveBeenCalledTimes(2);
      // First backoff: 1000ms * 2^0 = 1000ms
      expect(sleepSpy).toHaveBeenCalledWith(1000);
    });

    it('should retry up to MAX_RETRIES times on rate limit', async () => {
      const rateLimitedResponse = {
        status: 429,
        headers: new Headers({}),
        text: vi.fn().mockResolvedValue('Rate limited'),
        ok: false
      };

      mockFetch.mockResolvedValue(rateLimitedResponse);

      const sleepSpy = vi.spyOn(aiService as any, 'sleep').mockImplementation(async (ms: number) => {
        // Fast forward for test
        return Promise.resolve();
      });

      await expect((aiService as any).callAPI('test prompt')).rejects.toThrow();

      // Should retry 3 times (MAX_RETRIES = 3), so 4 total calls
      expect(mockFetch).toHaveBeenCalledTimes(4);
      // Backoff attempts: 1s, 2s, 4s
      expect(sleepSpy).toHaveBeenCalledTimes(3);
    }, 10000);

    it('should retry on network errors with exponential backoff', async () => {
      mockFetch.mockReset();

      const networkError = new Error('Network error');

      const successResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          choices: [{ message: { content: 'Success after network retry' } }]
        })
      };

      mockFetch
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce(successResponse);

      const sleepSpy = vi.spyOn(aiService as any, 'sleep').mockImplementation(async (ms: number) => {
        // Fast forward for test
        return Promise.resolve();
      });

      const result = await (aiService as any).callAPI('test prompt');

      expect(result).toBe('Success after network retry');
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(sleepSpy).toHaveBeenCalledWith(1000); // First backoff
    });

    it('should NOT retry on 400 Bad Request errors', async () => {
      const clientErrorResponse = {
        status: 400,
        statusText: 'Bad Request',
        text: vi.fn().mockResolvedValue('Invalid request'),
        ok: false
      };

      // Reset all mocks first to clear previous test's mocks
      mockFetch.mockReset();
      mockFetch.mockResolvedValue(clientErrorResponse);

      await expect((aiService as any).callAPI('test prompt')).rejects.toThrow('API error');

      // Should NOT retry - only 1 call
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('sleep helper', () => {
    it('should resolve after specified milliseconds', async () => {
      const start = Date.now();
      await (aiService as any).sleep(100);
      const elapsed = Date.now() - start;

      expect(elapsed).toBeGreaterThanOrEqual(90); // Allow some tolerance
      expect(elapsed).toBeLessThan(200);
    });
  });
});
