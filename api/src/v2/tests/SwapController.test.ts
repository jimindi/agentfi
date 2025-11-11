import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SwapController } from '../controllers/SwapController';
import { PrismaClient } from '@prisma/client';

describe('SwapController', () => {
  let controller: SwapController;
  let mockPrisma: any;
  let mockReq: any;
  let mockRes: any;

  beforeEach(() => {
    mockPrisma = {
      intent: {
        create: vi.fn().mockResolvedValue({
          id: 'test-intent-id',
          status: 'pending_deposit'
        })
      }
    };

    controller = new SwapController(mockPrisma as PrismaClient);

    mockReq = {
      body: {},
      params: {}
    };

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        quote: {
          depositAddress: 'test-deposit',
          amountOut: '28583',
          timeEstimate: 10
        }
      })
    });

    vi.clearAllMocks();
  });

  describe('executeSwap', () => {
    it('should return 200 with swap result', async () => {
      mockReq.body = {
        from: { chain: 'near', token: 'wNEAR', amount: '10000000000000000000000' },
        to: { chain: 'near', token: 'USDC' },
        user: { walletAddress: 'test.near' }
      };

      await controller.executeSwap(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          intentId: 'test-intent-id',
          depositAddress: 'test-deposit'
        })
      });
    });

    it('should return 500 on error', async () => {
      mockReq.body = {
        from: { chain: 'near', token: 'INVALID', amount: '10000000000000000000000' },
        to: { chain: 'near', token: 'USDC' },
        user: { walletAddress: 'test.near' }
      };

      await controller.executeSwap(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: expect.objectContaining({
          code: 'SWAP_FAILED'
        })
      });
    });
  });

  describe('getSwapStatus', () => {
    it('should return swap status', async () => {
      mockReq.params = { intentId: 'test-intent-id' };

      await controller.getSwapStatus(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          intentId: 'test-intent-id'
        })
      });
    });
  });
});
