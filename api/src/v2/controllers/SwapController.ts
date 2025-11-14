import { Request, Response, NextFunction } from 'express';
import { SwapService } from '../services/SwapService';
import { SwapRequest } from '../types/swap.types';
import { PrismaClient } from '@prisma/client';
import { UnauthorizedError } from '../errors';

export class SwapController {
  private swapService: SwapService;

  constructor(prisma: PrismaClient) {
    this.swapService = new SwapService(prisma);
  }

  async executeSwap(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Auth middleware ensures req.auth exists
      if (!req.auth) {
        throw new UnauthorizedError('Authentication required');
      }

      const swapRequest: SwapRequest = req.body;
      
      // Pass userId and apiKeyId to service
      const result = await this.swapService.executeSwap(
        swapRequest,
        req.auth.userId,
        req.auth.apiKeyId
      );

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async getSwapStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { intentId } = req.params;
      const status = await this.swapService.getSwapStatus(intentId);

      res.status(200).json({
        success: true,
        data: status
      });
    } catch (error) {
      next(error);
    }
  }
}
