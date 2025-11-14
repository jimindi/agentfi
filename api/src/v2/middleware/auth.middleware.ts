import { Request, Response, NextFunction } from 'express';
import { ApiKeyService } from '../services/ApiKeyService';
import { PrismaClient } from '@prisma/client';
import { UnauthorizedError } from '../errors';

const prisma = new PrismaClient();

// Extend Express Request to include auth data
declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        apiKeyId: string;
        rateLimitPerHour: number;
      };
    }
  }
}

/**
 * Middleware to authenticate API requests
 */
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Extract API key from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError(
        'API key is required. Provide it in Authorization header as "Bearer YOUR_KEY"'
      );
    }

    const apiKey = authHeader.substring(7); // Remove "Bearer "

    // Validate API key
    const result = await ApiKeyService.validateApiKey(prisma, apiKey);

    if (!result.valid || !result.keyData) {
      throw new UnauthorizedError('API key is invalid or expired');
    }

    // Attach auth data to request
    req.auth = {
      userId: result.keyData.userId,
      apiKeyId: result.keyData.id,
      rateLimitPerHour: result.keyData.rateLimitPerHour,
    };

    next();
  } catch (error) {
    next(error); // Pass to error handler
  }
}

/**
 * Optional authentication - allows both authenticated and anonymous requests
 */
export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const apiKey = authHeader.substring(7);
      const result = await ApiKeyService.validateApiKey(prisma, apiKey);
      
      if (result.valid && result.keyData) {
        req.auth = {
          userId: result.keyData.userId,
          apiKeyId: result.keyData.id,
          rateLimitPerHour: result.keyData.rateLimitPerHour,
        };
      }
    }
    
    next();
  } catch (error) {
    // Don't block request on auth errors for optional auth
    next();
  }
}
