import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { UnauthorizedError, ForbiddenError } from '../errors';

export interface CreateApiKeyParams {
  userId: string;
  name?: string;
  rateLimitPerHour?: number;
  expiresInDays?: number;
}

export interface ApiKeyResult {
  apiKey: string;
  keyId: string;
  name?: string;
  rateLimitPerHour: number;
  createdAt: Date;
  expiresAt?: Date;
}

export class ApiKeyService {
  private static readonly BCRYPT_ROUNDS = 12;
  private static readonly KEY_PREFIX_LENGTH = 12;

  /**
   * Generate a new API key
   */
  static generateKey(environment: 'live' | 'test' = 'live'): string {
    const randomPart = crypto.randomBytes(32).toString('hex');
    return `sk_${environment}_${randomPart}`;
  }

  /**
   * Create a new API key
   */
  static async createApiKey(
    prisma: PrismaClient,
    params: CreateApiKeyParams
  ): Promise<ApiKeyResult> {
    const apiKey = this.generateKey('live');
    const keyHash = await bcrypt.hash(apiKey, this.BCRYPT_ROUNDS);
    const keyPrefix = apiKey.substring(0, this.KEY_PREFIX_LENGTH);

    const expiresAt = params.expiresInDays
      ? new Date(Date.now() + params.expiresInDays * 24 * 60 * 60 * 1000)
      : undefined;

    const record = await prisma.apiKey.create({
      data: {
        userId: params.userId,
        keyHash,
        keyPrefix,
        name: params.name,
        rateLimitPerHour: params.rateLimitPerHour || 1000,
        expiresAt,
      },
    });

    return {
      apiKey, // Return plaintext key only once
      keyId: record.id,
      name: record.name || undefined,
      rateLimitPerHour: record.rateLimitPerHour,
      createdAt: record.createdAt,
      expiresAt: record.expiresAt || undefined,
    };
  }

  /**
   * Validate an API key
   */
  static async validateApiKey(
    prisma: PrismaClient,
    providedKey: string
  ): Promise<{
    valid: boolean;
    keyData?: {
      id: string;
      userId: string;
      rateLimitPerHour: number;
      isActive: boolean;
    };
  }> {
    // Extract prefix for fast lookup
    const keyPrefix = providedKey.substring(0, this.KEY_PREFIX_LENGTH);

    const apiKey = await prisma.apiKey.findFirst({
      where: {
        keyPrefix,
        isActive: true,
      },
    });

    if (!apiKey) {
      return { valid: false };
    }

    // Check expiration
    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      return { valid: false };
    }

    // Verify hash (constant-time comparison via bcrypt)
    const isValid = await bcrypt.compare(providedKey, apiKey.keyHash);

    if (!isValid) {
      return { valid: false };
    }

    // Update last used timestamp
    await prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    });

    return {
      valid: true,
      keyData: {
        id: apiKey.id,
        userId: apiKey.userId,
        rateLimitPerHour: apiKey.rateLimitPerHour,
        isActive: apiKey.isActive,
      },
    };
  }

  /**
   * List API keys for a user
   */
  static async listApiKeys(prisma: PrismaClient, userId: string) {
    return prisma.apiKey.findMany({
      where: { userId },
      select: {
        id: true,
        keyPrefix: true,
        name: true,
        rateLimitPerHour: true,
        isActive: true,
        lastUsedAt: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Revoke an API key
   */
  static async revokeApiKey(
    prisma: PrismaClient,
    keyId: string,
    userId: string
  ): Promise<boolean> {
    // First check if key exists and belongs to user
    const apiKey = await prisma.apiKey.findUnique({
      where: { id: keyId },
      select: { userId: true },
    });

    if (!apiKey) {
      throw new UnauthorizedError('API key not found');
    }

    if (apiKey.userId !== userId) {
      throw new ForbiddenError('You do not have permission to revoke this API key');
    }

    const result = await prisma.apiKey.updateMany({
      where: {
        id: keyId,
        userId,
      },
      data: {
        isActive: false,
      },
    });

    return result.count > 0;
  }
}
