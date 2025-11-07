import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

// Extend Express Request to include user info
declare global {
  namespace Express {
    interface Request {
      user?: any;
      apiKey?: any;
    }
  }
}

export async function authenticateApiKey(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Extract API key from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'MISSING_API_KEY',
          message: 'API key is required. Include it in the Authorization header.',
          statusCode: 401,
        },
      });
    }

    // Expected format: "Bearer sk_live_..." or just "sk_live_..."
    const apiKeyValue = authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : authHeader;

    if (!apiKeyValue || !apiKeyValue.startsWith('sk_')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_API_KEY_FORMAT',
          message: 'API key must start with "sk_"',
          statusCode: 401,
        },
      });
    }

    // Get key prefix (first 12 chars for lookup)
    const keyPrefix = apiKeyValue.substring(0, 12);

    // Find API key by prefix
    const apiKey = await prisma.apiKey.findFirst({
      where: {
        keyPrefix,
        isActive: true,
      },
      include: {
        user: true,
      },
    });

    if (!apiKey) {
      logger.warn({ keyPrefix }, 'API key not found');
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_API_KEY',
          message: 'API key is invalid or has been revoked',
          statusCode: 401,
        },
      });
    }

    // Verify the full key matches the hash
    const isValid = await bcrypt.compare(apiKeyValue, apiKey.keyHash);

    if (!isValid) {
      logger.warn({ keyPrefix, userId: apiKey.userId }, 'API key hash mismatch');
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_API_KEY',
          message: 'API key is invalid',
          statusCode: 401,
        },
      });
    }

    // Check if key has expired
    if (apiKey.expiresAt && new Date() > apiKey.expiresAt) {
      logger.warn({ keyPrefix, userId: apiKey.userId }, 'API key expired');
      return res.status(401).json({
        success: false,
        error: {
          code: 'API_KEY_EXPIRED',
          message: 'API key has expired',
          statusCode: 401,
        },
      });
    }

    // Update last used timestamp (async, don't wait)
    prisma.apiKey
      .update({
        where: { id: apiKey.id },
        data: { lastUsedAt: new Date() },
      })
      .catch((error) => {
        logger.error({ error, apiKeyId: apiKey.id }, 'Failed to update lastUsedAt');
      });

    // Attach user and API key info to request
    req.user = apiKey.user;
    req.apiKey = apiKey;

    logger.debug(
      { userId: apiKey.userId, apiKeyId: apiKey.id },
      'API key authenticated successfully'
    );

    next();
  } catch (error) {
    logger.error({ error }, 'Authentication error');
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Authentication failed',
        statusCode: 500,
      },
    });
  }
}

// Optional authentication - for public endpoints that can benefit from auth
export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    // No auth provided, continue without user info
    return next();
  }

  // Auth provided, validate it
  return authenticateApiKey(req, res, next);
}
