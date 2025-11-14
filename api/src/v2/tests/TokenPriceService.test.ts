import { describe, it, expect, beforeEach, vi } from 'vitest';
import TokenPriceService from '../services/TokenPriceService';
import { TokenService } from '../services/TokenService';
import { ValidationError } from '../errors';

// Mock TokenService
vi.mock('../services/TokenService');

describe('TokenPriceService', () => {
  let tokenPriceService: TokenPriceService;
  let mockTokenService: any;

  beforeEach(() => {
    mockTokenService = {
      getTokenPrice: vi.fn(),
    };
    tokenPriceService = new TokenPriceService(mockTokenService);
  });

  describe('getPrice', () => {
    it('should get price from TokenService', () => {
      mockTokenService.getTokenPrice.mockReturnValue(2.36);

      const price = tokenPriceService.getPrice('nep141:wrap.near');

      expect(price).toBe(2.36);
      expect(mockTokenService.getTokenPrice).toHaveBeenCalledWith('nep141:wrap.near');
    });

    it('should throw if token not found in TokenService', () => {
      mockTokenService.getTokenPrice.mockImplementation(() => {
        throw new ValidationError('Token not found: unknown:token');
      });

      expect(() => {
        tokenPriceService.getPrice('unknown:token');
      }).toThrow('Token not found');
    });
  });

  describe('calculateUsdValue', () => {
    it('should calculate USD value for wNEAR amount', () => {
      mockTokenService.getTokenPrice.mockReturnValue(2.36);

      // 10 wNEAR = 10000000000000000000000000 yoctoNEAR (24 decimals)
      const usdValue = tokenPriceService.calculateUsdValue(
        '10000000000000000000000000',
        24,
        'nep141:wrap.near'
      );

      expect(usdValue).toBeCloseTo(23.6, 1);
    });

    it('should calculate USD value for USDC amount', () => {
      mockTokenService.getTokenPrice.mockReturnValue(1.0);

      // 100 USDC = 100000000 microUSDC (6 decimals)
      const usdValue = tokenPriceService.calculateUsdValue(
        '100000000',
        6,
        'nep141:17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1'
      );

      expect(usdValue).toBe(100);
    });

    it('should handle BTC amount', () => {
      mockTokenService.getTokenPrice.mockReturnValue(95863);

      // 0.1 BTC = 10000000 satoshi (8 decimals)
      const usdValue = tokenPriceService.calculateUsdValue(
        '10000000',
        8,
        'nep141:btc.omft.near'
      );

      expect(usdValue).toBeCloseTo(9586.3, 1);
    });
  });

  describe('validateMinimumAmount', () => {
    it('should pass for amount above $5', () => {
      mockTokenService.getTokenPrice.mockReturnValue(2.36);

      // 10 wNEAR ≈ $23.60
      expect(() => {
        tokenPriceService.validateMinimumAmount(
          '10000000000000000000000000',
          24,
          'nep141:wrap.near'
        );
      }).not.toThrow();
    });

    it('should throw ValidationError for amount below $5', () => {
      mockTokenService.getTokenPrice.mockReturnValue(2.36);

      // 1 wNEAR ≈ $2.36
      expect(() => {
        tokenPriceService.validateMinimumAmount(
          '1000000000000000000000000',
          24,
          'nep141:wrap.near'
        );
      }).toThrow(ValidationError);
    });

    it('should include actual USD value in error', () => {
      mockTokenService.getTokenPrice.mockReturnValue(2.36);

      try {
        tokenPriceService.validateMinimumAmount(
          '1000000000000000000000000',
          24,
          'nep141:wrap.near'
        );
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.message).toContain('$2.36');
        expect(error.details.actualUsd).toBeCloseTo(2.36, 2);
        expect(error.details.minimumUsd).toBe(5.0);
      }
    });

    it('should pass for exactly $5', () => {
      mockTokenService.getTokenPrice.mockReturnValue(1.0);

      // 5 USDC = $5.00
      expect(() => {
        tokenPriceService.validateMinimumAmount(
          '5000000',
          6,
          'nep141:17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1'
        );
      }).not.toThrow();
    });
  });

  describe('formatAmount', () => {
    it('should format wNEAR amount', () => {
      const formatted = tokenPriceService.formatAmount(
        '10000000000000000000000000',
        24,
        'wNEAR'
      );

      expect(formatted).toBe('10.000000 wNEAR');
    });

    it('should format USDC amount', () => {
      const formatted = tokenPriceService.formatAmount(
        '100000000',
        6,
        'USDC'
      );

      expect(formatted).toBe('100.000000 USDC');
    });

    it('should format BTC amount', () => {
      const formatted = tokenPriceService.formatAmount(
        '10000000',
        8,
        'BTC'
      );

      expect(formatted).toBe('0.100000 BTC');
    });

    it('should limit decimals for high-decimal tokens', () => {
      const formatted = tokenPriceService.formatAmount(
        '1234567890123456789012345',
        24,
        'wNEAR'
      );

      // Should use max 6 decimals for display (tokens with >6 decimals)
      // Note: toFixed rounds, so 1.2345678... becomes 1.234568
      expect(formatted).toContain('wNEAR');
      expect(formatted).toMatch(/^1\.234568 wNEAR$/);
    });
  });

  describe('formatUsd', () => {
    it('should format USD value with 2 decimals', () => {
      expect(tokenPriceService.formatUsd(23.6)).toBe('$23.60');
      expect(tokenPriceService.formatUsd(100)).toBe('$100.00');
      expect(tokenPriceService.formatUsd(0.5)).toBe('$0.50');
    });

    it('should round to 2 decimals', () => {
      expect(tokenPriceService.formatUsd(23.456)).toBe('$23.46');
      expect(tokenPriceService.formatUsd(99.999)).toBe('$100.00');
    });
  });
});
