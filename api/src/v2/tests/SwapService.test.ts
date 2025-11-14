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

// Mock OneClickService
vi.mock('../services/OneClickService', () => ({
  default: {
    getQuote: vi.fn()
  }
}));

describe('SwapService', () => {
  let swapService: SwapService;

  beforeEach(() => {
    swapService = new SwapService(mockPrisma);
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

      await expect(swapService.executeSwap(request)).rejects.toThrow('below minimum');
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

      const result = await swapService.executeSwap(request);
      
      expect(result.intentId).toBe('intent-123');
      expect(result.status).toBe('pending_deposit');
      expect(result.fees).toBeDefined();
      expect(result.fees.platformFeeBps).toBe(15);
      expect(result.fees.platformFeeFormatted).toContain('wNEAR');
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
