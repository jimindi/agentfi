import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { SwapService } from '../services/SwapService';
import { ApiKeyService } from '../services/ApiKeyService';
import { TokenService } from '../services/TokenService';
import TokenPriceService from '../services/TokenPriceService';

const prisma = new PrismaClient();

describe('Integration Tests', () => {
  let swapService: SwapService;
  let tokenService: TokenService;
  let tokenPriceService: TokenPriceService;
  let testUserId: string;
  let testApiKeyId: string;

  beforeAll(async () => {
    // Initialize services
    tokenService = new TokenService();
    await tokenService.refreshTokenCache();
    
    tokenPriceService = new TokenPriceService(tokenService);
    swapService = new SwapService(prisma, tokenService, tokenPriceService);

    // Create test user and API key
    const user = await prisma.user.create({
      data: {
        email: 'integration-test@example.com',
      },
    });
    testUserId = user.id;

    const apiKey = await ApiKeyService.createApiKey(prisma, {
      userId: testUserId,
      name: 'Integration Test Key',
    });
    testApiKeyId = apiKey.keyId;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.intent.deleteMany({
      where: { userId: testUserId },
    });
    await prisma.apiKey.deleteMany({
      where: { userId: testUserId },
    });
    await prisma.user.delete({
      where: { id: testUserId },
    });
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

    const result = await swapService.executeSwap(
      swapRequest,
      testUserId,
      testApiKeyId
    );

    expect(result.intentId).toBeDefined();
    expect(result.status).toBe('pending_deposit');
    expect(result.depositAddress).toBeDefined();
    expect(result.from).toBeDefined();
    expect(result.from.symbol).toBe('wNEAR');
    expect(result.to).toBeDefined();
    expect(result.to.symbol).toBe('USDC');
  });
});
