import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ApiKeyService } from '../services/ApiKeyService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('ApiKeyService', () => {
  let testUserId: string;

  beforeAll(async () => {
    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'test-auth@example.com',
      },
    });
    testUserId = user.id;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.apiKey.deleteMany({
      where: { userId: testUserId },
    });
    await prisma.user.delete({
      where: { id: testUserId },
    });
    await prisma.$disconnect();
  });

  describe('generateKey', () => {
    it('should generate key with correct format', () => {
      const key = ApiKeyService.generateKey('live');
      expect(key).toMatch(/^sk_live_[a-f0-9]{64}$/);
    });

    it('should generate unique keys', () => {
      const key1 = ApiKeyService.generateKey('live');
      const key2 = ApiKeyService.generateKey('live');
      expect(key1).not.toBe(key2);
    });
  });

  describe('createApiKey', () => {
    it('should create API key successfully', async () => {
      const result = await ApiKeyService.createApiKey(prisma, {
        userId: testUserId,
        name: 'Test Key',
        rateLimitPerHour: 1000,
      });

      expect(result.apiKey).toMatch(/^sk_live_/);
      expect(result.keyId).toBeDefined();
      expect(result.name).toBe('Test Key');
      expect(result.rateLimitPerHour).toBe(1000);
    });
  });

  describe('validateApiKey', () => {
    it('should validate correct API key', async () => {
      const created = await ApiKeyService.createApiKey(prisma, {
        userId: testUserId,
        name: 'Validation Test',
      });

      const result = await ApiKeyService.validateApiKey(prisma, created.apiKey);

      expect(result.valid).toBe(true);
      expect(result.keyData?.userId).toBe(testUserId);
    });

    it('should reject invalid API key', async () => {
      const result = await ApiKeyService.validateApiKey(prisma, 'sk_live_invalid');

      expect(result.valid).toBe(false);
      expect(result.keyData).toBeUndefined();
    });

    it('should reject expired API key', async () => {
      const created = await ApiKeyService.createApiKey(prisma, {
        userId: testUserId,
        name: 'Expired Key',
        expiresInDays: -1, // Already expired
      });

      const result = await ApiKeyService.validateApiKey(prisma, created.apiKey);

      expect(result.valid).toBe(false);
    });
  });

  describe('listApiKeys', () => {
    it('should list user API keys', async () => {
      await ApiKeyService.createApiKey(prisma, {
        userId: testUserId,
        name: 'List Test 1',
      });

      await ApiKeyService.createApiKey(prisma, {
        userId: testUserId,
        name: 'List Test 2',
      });

      const keys = await ApiKeyService.listApiKeys(prisma, testUserId);

      expect(keys.length).toBeGreaterThanOrEqual(2);
      expect(keys[0].name).toBeDefined();
    });
  });

  describe('revokeApiKey', () => {
    it('should revoke API key', async () => {
      const created = await ApiKeyService.createApiKey(prisma, {
        userId: testUserId,
        name: 'Revoke Test',
      });

      const success = await ApiKeyService.revokeApiKey(
        prisma,
        created.keyId,
        testUserId
      );

      expect(success).toBe(true);

      // Validate should fail
      const result = await ApiKeyService.validateApiKey(prisma, created.apiKey);
      expect(result.valid).toBe(false);
    });
    it('should not revoke key for wrong user', async () => {
      const created = await ApiKeyService.createApiKey(prisma, {
        userId: testUserId,
        name: 'Wrong User Test',
      });
      
      await expect(
        ApiKeyService.revokeApiKey(
          prisma,
          created.keyId,
          '00000000-0000-0000-0000-000000000000'
        )
      ).rejects.toThrow('You do not have permission to revoke this API key');
    });
  });
});
