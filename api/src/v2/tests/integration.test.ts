import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { SwapService } from '../services/SwapService';

describe('Integration Tests', () => {
  let prisma: PrismaClient;
  let swapService: SwapService;

  beforeAll(async () => {
    prisma = new PrismaClient();
    swapService = new SwapService(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should execute complete swap flow', async () => {
    const result = await swapService.executeSwap({
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
        walletAddress: 'test-integration.near'
      }
    });

    // Verify result structure
    expect(result.intentId).toBeDefined();
    expect(result.depositAddress).toBeDefined();
    expect(result.status).toBe('pending_deposit');
    expect(result.estimatedOutput).toBeDefined();

    // Verify database record
    const intent = await prisma.intent.findUnique({
      where: { id: result.intentId }
    });

    expect(intent).toBeDefined();
    expect(intent?.status).toBe('pending_deposit');
    expect(intent?.userWalletAddress).toBe('test-integration.near');

    // Cleanup
    await prisma.intent.delete({
      where: { id: result.intentId }
    });
  });
});
