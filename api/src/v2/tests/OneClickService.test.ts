import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OneClickService } from '../services/OneClickService';

describe('OneClickService', () => {
  let service: OneClickService;

  beforeEach(() => {
    service = new OneClickService();
    vi.clearAllMocks();
  });

  describe('getQuote', () => {
    it('should return quote with deposit address', async () => {
      // Mock fetch response
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          quote: {
            depositAddress: 'test-deposit-address',
            amountOut: '28583',
            timeEstimate: 10
          }
        })
      });

      const result = await service.getQuote({
        originAsset: 'nep141:wrap.near',
        destinationAsset: 'nep141:usdc.near',
        amount: '10000000000000000000000',
        recipient: 'test.near'
      });

      expect(result.depositAddress).toBe('test-deposit-address');
      expect(result.estimatedOutput).toBe('28583');
      expect(result.estimatedTimeSeconds).toBe(10);
    });

    it('should throw error on API failure', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500
      });

      await expect(
        service.getQuote({
          originAsset: 'nep141:wrap.near',
          destinationAsset: 'nep141:usdc.near',
          amount: '10000000000000000000000',
          recipient: 'test.near'
        })
      ).rejects.toThrow('OneClick API error: 500');
    });
  });
});
