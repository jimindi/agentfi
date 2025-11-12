import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { SwapService } from '../services/SwapService';

const prisma = new PrismaClient();

describe('Integration Tests', () => {
  let swapService: SwapService;

  beforeAll(() => {
    swapService = new SwapService(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should execute complete swap flow', async () => {
    const swapRequest = {
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

    const result = await swapService.executeSwap(swapRequest);

    expect(result.intentId).toBeDefined();
    expect(result.status).toBe('pending_deposit');
    expect(result.depositAddress).toBeDefined();
  });
});
