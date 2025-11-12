import { describe, it, expect, vi, beforeEach } from 'vitest';
import OneClickService from '../services/OneClickService';

// Mock fetch globally
global.fetch = vi.fn();

describe('OneClickService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getQuote', () => {
    it('should return quote with deposit address', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          quote: {
            depositAddress: 'abc123',
            amountOut: '23256'
          }
        })
      };

      vi.mocked(fetch).mockResolvedValue(mockResponse as any);

      const result = await OneClickService.getQuote({
        fromAsset: 'nep141:wrap.near',
        toAsset: 'nep141:17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1',
        amount: '10000000000000000000000',
        userWallet: 'test.near'
      });

      expect(result.depositAddress).toBe('abc123');
      expect(result.estimatedOutput).toBe('23256');
    });

    it('should throw error on API failure', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      };

      vi.mocked(fetch).mockResolvedValue(mockResponse as any);

      await expect(
        OneClickService.getQuote({
          fromAsset: 'nep141:wrap.near',
          toAsset: 'nep141:17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1',
          amount: '10000000000000000000000',
          userWallet: 'test.near'
        })
      ).rejects.toThrow();
    });
  });
});
