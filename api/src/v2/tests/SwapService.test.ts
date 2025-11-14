import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SwapService } from '../services/SwapService';
import { PrismaClient } from '@prisma/client';
import OneClickService from '../services/OneClickService';

// Mock Prisma
const mockPrisma = {
  intent: {
    create: vi.fn(),
    findUnique: vi.fn()
  }
} as unknown as PrismaClient;

// Mock TokenService
const mockTokenService = {
  resolveToken: vi.fn((token: string, chain: string) => {
    if (token === 'wNEAR' && chain === 'near') {
      return {
        assetId: 'nep141:wrap.near',
        symbol: 'wNEAR',
        blockchain: 'near',
        decimals: 24,
        price: 2.36,
        contractAddress: 'wrap.near'
      };
    }
    if (token === 'USDC' && chain === 'near') {
      return {
        assetId: 'nep141:17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1',
        symbol: 'USDC',
        blockchain: 'near',
        decimals: 6,
        price: 1.0,
        contractAddress: '17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1'
      };
    }
    throw new Error(`Unknown token: ${token} on ${chain}`);
  }),
  getTokenPrice: vi.fn(() => 2.36)
};

// Mock TokenPriceService
const mockTokenPriceService = {
  validateMinimumAmount: vi.fn((amount: string, decimals: number, assetId: string) => {
    // Calculate USD value
    const numericAmount = Number(amount) / Math.pow(10, decimals);
    const price = assetId.includes('wrap.near') ? 2.36 : 1.0;
    const usdValue = numericAmount * price;
    
    if (usdValue < 5.0) {
      throw new Error(`Transaction amount ($${usdValue.toFixed(2)}) is below minimum of $5.00`);
    }
  }),
  calculateUsdValue: vi.fn(async (amount: string, decimals: number, assetId: string) => {
    const numericAmount = Number(amount) / Math.pow(10, decimals);
    const price = assetId.includes('wrap.near') ? 2.36 : 1.0;
    return numericAmount * price;
  }),
  formatAmount: vi.fn((amount: string, decimals: number, symbol: string) => {
    const value = Number(amount) / Math.pow(10, decimals);
    return `${value.toFixed(6)} ${symbol}`;
  }),
  formatUsd: vi.fn((usdValue: number) => `$${usdValue.toFixed(2)}`)
};

// Mock OneClickService
vi.mock('../services/OneClickService', () => ({
  default: {
    getQuote: vi.fn()
  }
}));

describe('SwapService', () => {
  let swapService: SwapService;

  beforeEach(() => {
    swapService = new SwapService(mockPrisma, mockTokenService as any, mockTokenPriceService as any);
    vi.clearAllMocks();
  });

  describe('executeSwap', () => {
    it('should reject swap below $5 minimum', async () => {
      const request = {
        from: {
          chain: 'near',
          token: 'wNEAR',
          amount: '10000000000000000000000' // 0.01 wNEAR (~$0.023)
        },
        to: {
          chain: 'near',
          token: 'USDC'
        },
        user: {
          walletAddress: 'test.near'
        }
      };

      await expect(swapService.executeSwap(request, 'user-123', 'apikey-123')).rejects.toThrow('below minimum');
    });

    it('should accept swap above $5 minimum', async () => {
      // Mock OneClick response with fee structure
      vi.mocked(OneClickService.getQuote).mockResolvedValue({
        depositAddress: 'abc123',
        estimatedOutput: '5000000',
        estimatedTimeSeconds: 60,
        amountIn: '2200000000000000000000000',
        amountOut: '5000000',
        fees: {
          platformFeeBps: 15,
          platformFeeAmount: '3300000000000000000000',
          networkFeeEstimate: '500000000000000000000000'
        }
      });

      // Mock Prisma response
      vi.mocked(mockPrisma.intent.create).mockResolvedValue({
        id: 'intent-123',
        status: 'pending_deposit'
      } as any);

      const request = {
        from: {
          chain: 'near',
          token: 'wNEAR',
          amount: '2200000000000000000000000' // 2.2 wNEAR (~$5.15)
        },
        to: {
          chain: 'near',
          token: 'USDC'
        },
        user: {
          walletAddress: 'test.near'
        }
      };

      const result = await swapService.executeSwap(request, 'user-123', 'apikey-123');
      
      expect(result.intentId).toBe('intent-123');
      expect(result.status).toBe('pending_deposit');
      expect(result.from).toBeDefined();
      expect(result.from.symbol).toBe('wNEAR');
      expect(result.to).toBeDefined();
      expect(result.to.symbol).toBe('USDC');
      expect(result.fees).toBeDefined();
      expect(result.fees.platformFeeBps).toBe(15);
      expect(OneClickService.getQuote).toHaveBeenCalled();
    });
  });

  describe('getSwapStatus', () => {
    it('should return swap status from database', async () => {
      const mockIntent = {
        id: 'intent-123',
        status: 'completed',
        fromChain: 'near',
        fromToken: 'wNEAR',
        fromAmount: '10000000000000000000000',
        toChain: 'near',
        toToken: 'USDC',
        actualOutputAmount: '23256',
        txHash: 'tx123',
        createdAt: new Date(),
        completedAt: new Date()
      };

      vi.mocked(mockPrisma.intent.findUnique).mockResolvedValue(mockIntent as any);

      const status = await swapService.getSwapStatus('intent-123');
      
      expect(status.intentId).toBe('intent-123');
      expect(status.status).toBe('completed');
      expect(status.txHash).toBe('tx123');
    });

    it('should throw error if intent not found', async () => {
      vi.mocked(mockPrisma.intent.findUnique).mockResolvedValue(null);

      await expect(swapService.getSwapStatus("nonexistent")).rejects.toThrow("Intent with ID");
    });
  });
});
