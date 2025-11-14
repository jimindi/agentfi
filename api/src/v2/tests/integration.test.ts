import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { SwapService } from '../services/SwapService';
import { OneClickService } from '../services/OneClickService';
import tokenService from '../services/TokenService';
import TokenPriceService from '../services/TokenPriceService';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';

vi.mock('axios');
const mockedAxios = vi.mocked(axios);

describe('Integration Tests', () => {
  let swapService: SwapService;
  let prisma: PrismaClient;

  const mockTokensResponse = [
    {
      assetId: 'nep141:wrap.near',
      symbol: 'wNEAR',
      blockchain: 'near',
      decimals: 24,
      contractAddress: 'wrap.near',
      price: '2.5',
    },
    {
      assetId: 'nep141:17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1',
      symbol: 'USDC',
      blockchain: 'near',
      decimals: 6,
      contractAddress: '17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1',
      price: '1.0',
    },
  ];

  beforeAll(async () => {
    prisma = new PrismaClient();

    // Clean up any existing test user
    const testEmail = 'test-integration@example.com';
    const existingUser = await prisma.user.findUnique({
      where: { email: testEmail },
      include: { apiKeys: true, intents: true },
    });

    if (existingUser) {
      // Delete related records first
      await prisma.intent.deleteMany({ where: { userId: existingUser.id } });
      await prisma.apiKey.deleteMany({ where: { userId: existingUser.id } });
      await prisma.user.delete({ where: { id: existingUser.id } });
    }

    // Initialize TokenService with mock data
    mockedAxios.get.mockResolvedValue({ data: mockTokensResponse });
    await tokenService.refreshTokenCache();

    // Create services
    const tokenPriceService = new TokenPriceService(tokenService);
    swapService = new SwapService(prisma, tokenService, tokenPriceService);
  });

  describe('Complete swap flow', () => {
    it('should execute complete swap flow with token resolution', async () => {
      // Mock OneClick API response
      const mockQuoteResponse = {
        deposit_address: 'swap-deposit.near',
        estimated_output_amount: '5000000',
        fees: {
          oneclick_fee: { amount: '1000000', asset_id: 'nep141:wrap.near' },
          defuse_fee: { amount: '500000', asset_id: 'nep141:wrap.near' },
          network_fee: { amount: '250000', asset_id: 'nep141:wrap.near' },
        },
      };

      mockedAxios.post.mockResolvedValue({ data: mockQuoteResponse });

      // Create mock user and API key
      const user = await prisma.user.create({
        data: {
          email: 'test-integration@example.com',
          planTier: 'free',
        },
      });

      const apiKey = await prisma.apiKey.create({
        data: {
          userId: user.id,
          name: 'Test Integration Key',
          keyHash: 'test-hash',
          keyPrefix: 'test_',
          rateLimitPerHour: 100,
        },
      });

      // Execute swap
      const result = await swapService.executeSwap(
        {
          from: {
            chain: 'near',
            token: 'wNEAR',
            amount: '10000000000000000000000000', // 10 wNEAR = $25
          },
          to: {
            chain: 'near',
            token: 'USDC',
          },
          user: {
            walletAddress: 'test.near',
          },
        },
        user.id,
        apiKey.id
      );

      // Verify result structure
      expect(result).toHaveProperty('intentId');
      expect(result).toHaveProperty('status', 'pending_deposit');
      expect(result).toHaveProperty('depositAddress');
      expect(result).toHaveProperty('from');
      expect(result).toHaveProperty('to');

      // Verify token metadata in response
      expect(result.from).toMatchObject({
        symbol: 'wNEAR',
        assetId: 'nep141:wrap.near',
        blockchain: 'near',
        decimals: 24,
      });

      expect(result.to).toMatchObject({
        symbol: 'USDC',
        assetId: 'nep141:17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1',
        blockchain: 'near',
        decimals: 6,
      });

      // Verify intent was created in database
      const intent = await prisma.intent.findUnique({
        where: { id: result.intentId },
      });

      expect(intent).toBeDefined();
      expect(intent?.status).toBe('pending_deposit');

      // Cleanup
      await prisma.intent.delete({ where: { id: result.intentId } });
      await prisma.apiKey.delete({ where: { id: apiKey.id } });
      await prisma.user.delete({ where: { id: user.id } });
    });
  });
});
