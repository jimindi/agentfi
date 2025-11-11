import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SwapService } from '../services/SwapService';
import { PrismaClient } from '@prisma/client';

describe('SwapService', () => {
  let service: SwapService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      intent: {
        create: vi.fn().mockResolvedValue({
          id: 'test-intent-id',
          status: 'pending_deposit'
        })
      }
    };

    service = new SwapService(mockPrisma as PrismaClient);
    vi.clearAllMocks();
  });

  describe('executeSwap', () => {
    it('should create swap and return deposit address', async () => {
      // Mock OneClickService
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

      const result = await service.executeSwap({
        from: {
          chain: 'near',
          token: 'wNEAR',
          amount: '10000000000000000000000'
        },
        to: {
          chain: 'near',
          token: 'USDC'
        },
        user: {
          walletAddress: 'test.near'
        }
      });

      expect(result.intentId).toBe('test-intent-id');
      expect(result.depositAddress).toBe('test-deposit-address');
      expect(result.status).toBe('pending_deposit');
      expect(mockPrisma.intent.create).toHaveBeenCalled();
    });

    it('should throw error for unsupported token', async () => {
      await expect(
        service.executeSwap({
          from: {
            chain: 'near',
            token: 'INVALID',
            amount: '10000000000000000000000'
          },
          to: {
            chain: 'near',
            token: 'USDC'
          },
          user: {
            walletAddress: 'test.near'
          }
        })
      ).rejects.toThrow('Unsupported token');
    });
  });
});
