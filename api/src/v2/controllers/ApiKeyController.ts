import { Request, Response } from 'express';
import { ApiKeyService } from '../services/ApiKeyService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ApiKeyController {
  /**
   * Create a new API key
   * POST /v2/auth/api-key
   */
  static async createApiKey(req: Request, res: Response): Promise<void> {
    try {
      const { email, name, rateLimitPerHour, expiresInDays } = req.body;

      // Validation
      if (!email || typeof email !== 'string') {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_EMAIL',
            message: 'Valid email is required',
            statusCode: 400,
          },
        });
        return;
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
    } catch (error) {
      console.error('Error creating API key:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create API key',
          statusCode: 500,
        },
      });
    }
  }

  /**
   * List API keys for authenticated user
   * GET /v2/auth/api-keys
   */
  static async listApiKeys(req: Request, res: Response): Promise<void> {
    try {
      if (!req.auth) {
        res.status(401).json({
          success: false,
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication required',
            statusCode: 401,
          },
        });
        return;
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
    } catch (error) {
      console.error('Error listing API keys:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to list API keys',
          statusCode: 500,
        },
      });
    }
  }

  /**
   * Revoke an API key
   * DELETE /v2/auth/api-key/:keyId
   */
  static async revokeApiKey(req: Request, res: Response): Promise<void> {
    try {
      if (!req.auth) {
        res.status(401).json({
          success: false,
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication required',
            statusCode: 401,
          },
        });
        return;
      }

      const { keyId } = req.params;

      const success = await ApiKeyService.revokeApiKey(
        prisma,
        keyId,
        req.auth.userId
      );

      if (!success) {
        res.status(404).json({
          success: false,
          error: {
            code: 'API_KEY_NOT_FOUND',
            message: 'API key not found or you do not have permission to revoke it',
            statusCode: 404,
          },
        });
        return;
      }

      res.json({
        success: true,
        message: 'API key revoked successfully',
      });
    } catch (error) {
      console.error('Error revoking API key:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to revoke API key',
          statusCode: 500,
        },
      });
    }
  }
}
