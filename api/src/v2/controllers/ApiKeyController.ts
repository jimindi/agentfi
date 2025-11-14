import { Request, Response } from 'express';
import { ApiKeyService } from '../services/ApiKeyService';
import { PrismaClient } from '@prisma/client';
import { BadRequestError, UnauthorizedError } from '../errors';
import { asyncHandler } from '../middleware';

const prisma = new PrismaClient();

export class ApiKeyController {
  /**
   * Create a new API key
   * POST /v2/auth/api-key
   */
  static createApiKey = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email, name, rateLimitPerHour, expiresInDays } = req.body;

    // Validation
    if (!email || typeof email !== 'string') {
      throw new BadRequestError('Valid email is required');
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: { email },
      });
    }

    // Create API key
    const result = await ApiKeyService.createApiKey(prisma, {
      userId: user.id,
      name,
      rateLimitPerHour,
      expiresInDays,
    });

    res.status(201).json({
      success: true,
      data: {
        apiKey: result.apiKey,
        keyId: result.keyId,
        name: result.name,
        rateLimitPerHour: result.rateLimitPerHour,
        createdAt: result.createdAt.toISOString(),
        expiresAt: result.expiresAt?.toISOString(),
      },
      warning: 'Store this key securely. It will not be shown again.',
    });
  });

  /**
   * List API keys for authenticated user
   * GET /v2/auth/api-keys
   */
  static listApiKeys = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.auth) {
      throw new UnauthorizedError('Authentication required');
    }

    const apiKeys = await ApiKeyService.listApiKeys(prisma, req.auth.userId);

    res.json({
      success: true,
      data: {
        apiKeys: apiKeys.map((key) => ({
          keyId: key.id,
          keyPrefix: key.keyPrefix,
          name: key.name,
          rateLimitPerHour: key.rateLimitPerHour,
          isActive: key.isActive,
          lastUsedAt: key.lastUsedAt?.toISOString(),
          createdAt: key.createdAt.toISOString(),
          expiresAt: key.expiresAt?.toISOString(),
        })),
        total: apiKeys.length,
      },
    });
  });

  /**
   * Revoke an API key
   * DELETE /v2/auth/api-key/:keyId
   */
  static revokeApiKey = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.auth) {
      throw new UnauthorizedError('Authentication required');
    }

    const { keyId } = req.params;

    // This will throw appropriate errors if key not found or forbidden
    await ApiKeyService.revokeApiKey(prisma, keyId, req.auth.userId);

    res.json({
      success: true,
      message: 'API key revoked successfully',
    });
  });
}
