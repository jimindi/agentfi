import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { z, ZodError } from 'zod';
import { logger } from '../utils/logger';
import { authenticateApiKey } from '../middleware/auth.middleware';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const CreateApiKeySchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100).optional(),
  companyName: z.string().max(255).optional(),
  rateLimitPerHour: z.number().int().min(100).max(100000).optional(),
  expiresInDays: z.number().int().min(1).max(3650).optional(),
});

// POST /v1/auth/api-key - Create new API key
router.post('/api-key', async (req, res) => {
  try {
    const validated = CreateApiKeySchema.parse(req.body);

    // Check if user exists, create if not
    let user = await prisma.user.findUnique({
      where: { email: validated.email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: validated.email,
          companyName: validated.companyName,
          planTier: 'free',
        },
      });
      logger.info({ userId: user.id, email: user.email }, 'New user created');
    }

    // Generate API key
    const env = process.env.NODE_ENV === 'production' ? 'live' : 'test';
    const randomPart = crypto.randomBytes(32).toString('hex');
    const apiKey = `sk_${env}_${randomPart}`;

    // Hash the key
    const keyHash = await bcrypt.hash(apiKey, 12);
    const keyPrefix = apiKey.substring(0, 12);

    // Calculate expiration
    const expiresAt = validated.expiresInDays
      ? new Date(Date.now() + validated.expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    // Store in database
    const apiKeyRecord = await prisma.apiKey.create({
      data: {
        userId: user.id,
        keyHash,
        keyPrefix,
        name: validated.name || 'Default API Key',
        rateLimitPerHour: validated.rateLimitPerHour || 1000,
        isActive: true,
        expiresAt,
      },
    });

    logger.info(
      {
        userId: user.id,
        apiKeyId: apiKeyRecord.id,
        keyPrefix,
      },
      'API key created'
    );

    return res.status(201).json({
      success: true,
      data: {
        apiKey, // Only time we return the full key!
        keyId: apiKeyRecord.id,
        keyPrefix,
        name: apiKeyRecord.name,
        rateLimitPerHour: apiKeyRecord.rateLimitPerHour,
        createdAt: apiKeyRecord.createdAt,
        expiresAt: apiKeyRecord.expiresAt,
      },
      warning:
        '⚠️  Store this API key securely. It will not be shown again. If lost, you must create a new key.',
    });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PARAMETERS',
          message: 'Validation failed',
          details: error.issues,
          statusCode: 400,
        },
      });
    }

    logger.error({ error }, 'Failed to create API key');
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create API key',
        statusCode: 500,
      },
    });
  }
});

// GET /v1/auth/api-keys - List user's API keys (requires auth)
router.get('/api-keys', authenticateApiKey, async (req, res) => {
  try {
    const apiKeys = await prisma.apiKey.findMany({
      where: {
        userId: req.user!.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
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
    });

    return res.json({
      success: true,
      data: {
        apiKeys,
        total: apiKeys.length,
      },
    });
  } catch (error) {
    logger.error({ error, userId: req.user?.id }, 'Failed to list API keys');
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to list API keys',
        statusCode: 500,
      },
    });
  }
});

// DELETE /v1/auth/api-key/:keyId - Revoke API key (requires auth)
router.delete('/api-key/:keyId', authenticateApiKey, async (req, res) => {
  try {
    const { keyId } = req.params;

    // Verify key belongs to user
    const apiKey = await prisma.apiKey.findFirst({
      where: {
        id: keyId,
        userId: req.user!.id,
      },
    });

    if (!apiKey) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'API_KEY_NOT_FOUND',
          message: 'API key not found or does not belong to you',
          statusCode: 404,
        },
      });
    }

    // Deactivate the key
    await prisma.apiKey.update({
      where: { id: keyId },
      data: { isActive: false },
    });

    logger.info({ userId: req.user!.id, keyId }, 'API key revoked');

    return res.json({
      success: true,
      message: 'API key revoked successfully',
    });
  } catch (error) {
    logger.error({ error, keyId: req.params.keyId }, 'Failed to revoke API key');
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to revoke API key',
        statusCode: 500,
      },
    });
  }
});

export default router;
