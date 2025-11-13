import { describe, it, expect } from 'vitest';
import { RATE_LIMITS, getRateLimitInfo, resetRateLimit } from '../services/RateLimitService';

describe('RateLimitService', () => {
  describe('Rate Limit Configuration', () => {
    it('should have correct IP hourly limit', () => {
      expect(RATE_LIMITS.IP_HOURLY.max).toBe(100);
      expect(RATE_LIMITS.IP_HOURLY.windowMs).toBe(60 * 60 * 1000);
    });

    it('should have correct API key hourly limit', () => {
      expect(RATE_LIMITS.API_KEY_HOURLY.max).toBe(1000);
      expect(RATE_LIMITS.API_KEY_HOURLY.windowMs).toBe(60 * 60 * 1000);
    });

    it('should have correct swap per minute limit', () => {
      expect(RATE_LIMITS.SWAP_PER_MINUTE.max).toBe(10);
      expect(RATE_LIMITS.SWAP_PER_MINUTE.windowMs).toBe(60 * 1000);
    });

    it('should have correct auth per minute limit', () => {
      expect(RATE_LIMITS.AUTH_PER_MINUTE.max).toBe(5);
      expect(RATE_LIMITS.AUTH_PER_MINUTE.windowMs).toBe(60 * 1000);
    });
  });

  describe('Error Messages', () => {
    it('should have proper error format for IP limit', () => {
      const msg = RATE_LIMITS.IP_HOURLY.message as any;
      expect(msg.success).toBe(false);
      expect(msg.error.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(msg.error.retryAfter).toBe(3600);
    });

    it('should have proper error format for swap limit', () => {
      const msg = RATE_LIMITS.SWAP_PER_MINUTE.message as any;
      expect(msg.success).toBe(false);
      expect(msg.error.code).toBe('SWAP_RATE_LIMIT_EXCEEDED');
      expect(msg.error.retryAfter).toBe(60);
    });

    it('should have proper error format for auth limit', () => {
      const msg = RATE_LIMITS.AUTH_PER_MINUTE.message as any;
      expect(msg.success).toBe(false);
      expect(msg.error.code).toBe('AUTH_RATE_LIMIT_EXCEEDED');
      expect(msg.error.retryAfter).toBe(60);
    });
  });

  describe('getRateLimitInfo', () => {
    it('should return rate limit information structure', async () => {
      const info = await getRateLimitInfo('test-user-123');
      
      expect(info).toHaveProperty('limit');
      expect(info).toHaveProperty('remaining');
      expect(info).toHaveProperty('reset');
      expect(info.limit).toBe(1000);
      expect(info.remaining).toBeGreaterThanOrEqual(0);
      expect(info.remaining).toBeLessThanOrEqual(1000);
      expect(info.reset).toBeInstanceOf(Date);
    });

    it('should return default values on Redis error', async () => {
      // Test with non-existent user (should return defaults gracefully)
      const info = await getRateLimitInfo('nonexistent-user-xyz-999');
      
      expect(info.limit).toBe(1000);
      expect(info.remaining).toBeGreaterThanOrEqual(0);
      expect(info.reset).toBeInstanceOf(Date);
    });
  });

  describe('resetRateLimit', () => {
    it('should not throw when resetting rate limit', async () => {
      const userId = 'test-user-reset-123';
      
      await expect(resetRateLimit(userId)).resolves.not.toThrow();
    });
  });

  describe('Key Generator Logic', () => {
    it('should use user ID when available', () => {
      const keyGen = RATE_LIMITS.API_KEY_HOURLY.keyGenerator as any;
      const req = { user: { id: 'user-123' } };
      
      const key = keyGen(req);
      expect(key).toBe('user:user-123');
    });

    it('should return undefined when no user (fallback to IP)', () => {
      const keyGen = RATE_LIMITS.API_KEY_HOURLY.keyGenerator as any;
      const req = { ip: '1.2.3.4' };
      
      const key = keyGen(req);
      expect(key).toBeUndefined();
    });

    it('swap limiter should use user ID when available', () => {
      const keyGen = RATE_LIMITS.SWAP_PER_MINUTE.keyGenerator as any;
      const req = { user: { id: 'user-456' } };
      
      const key = keyGen(req);
      expect(key).toBe('user:user-456');
    });
  });

  describe('Standard Headers', () => {
    it('should enable standard rate limit headers', () => {
      expect(RATE_LIMITS.IP_HOURLY.standardHeaders).toBe(true);
      expect(RATE_LIMITS.API_KEY_HOURLY.standardHeaders).toBe(true);
      expect(RATE_LIMITS.SWAP_PER_MINUTE.standardHeaders).toBe(true);
      expect(RATE_LIMITS.AUTH_PER_MINUTE.standardHeaders).toBe(true);
    });

    it('should disable legacy headers', () => {
      expect(RATE_LIMITS.IP_HOURLY.legacyHeaders).toBe(false);
      expect(RATE_LIMITS.API_KEY_HOURLY.legacyHeaders).toBe(false);
      expect(RATE_LIMITS.SWAP_PER_MINUTE.legacyHeaders).toBe(false);
      expect(RATE_LIMITS.AUTH_PER_MINUTE.legacyHeaders).toBe(false);
    });
  });
});
