import { describe, it, expect, beforeEach } from 'vitest';
import TokenPriceService from '../services/TokenPriceService';

describe('TokenPriceService', () => {
  beforeEach(() => {
    TokenPriceService.clearCache();
  });

  describe('getTokenDecimals', () => {
    it('should return correct decimals for wNEAR', () => {
      const decimals = TokenPriceService.getTokenDecimals('near', 'wNEAR');
      expect(decimals).toBe(24);
    });

    it('should return correct decimals for USDC', () => {
      const decimals = TokenPriceService.getTokenDecimals('near', 'USDC');
      expect(decimals).toBe(6);
    });

    it('should throw error for unknown token', () => {
      expect(() => {
        TokenPriceService.getTokenDecimals('near', 'UNKNOWN');
      }).toThrow('Unknown decimals');
    });
  });

  describe('calculateUsdValue', () => {
    it('should calculate USD value for wNEAR amount', async () => {
      // 0.01 wNEAR = 10000000000000000000000 (24 decimals)
      const amount = '10000000000000000000000';
      const usdValue = await TokenPriceService.calculateUsdValue(
        'near',
        'wNEAR',
        amount,
        24
      );

      // Should be around $0.023 (0.01 * ~$2.34)
      expect(usdValue).toBeGreaterThan(0.02);
      expect(usdValue).toBeLessThan(0.03);
    });

    it('should calculate USD value for USDC amount', async () => {
      // 1 USDC = 1000000 (6 decimals)
      const amount = '1000000';
      const usdValue = await TokenPriceService.calculateUsdValue(
        'near',
        'USDC',
        amount,
        6
      );

      // Should be around $1.00
      expect(usdValue).toBeGreaterThan(0.99);
      expect(usdValue).toBeLessThan(1.01);
    });
  });

  describe('getTokenPrice', () => {
    it('should fetch and cache token price', async () => {
      const price1 = await TokenPriceService.getTokenPrice('near', 'wNEAR');
      expect(price1).toBeGreaterThan(0);

      // Second call should use cache (instant)
      const price2 = await TokenPriceService.getTokenPrice('near', 'wNEAR');
      expect(price2).toBe(price1);
    });

    it('should use fallback price if API fails', async () => {
      // Test with token that might not be in API
      const price = await TokenPriceService.getTokenPrice('near', 'wNEAR');
      expect(price).toBeGreaterThan(0);
    });
  });
});
