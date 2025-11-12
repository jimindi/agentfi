import { Request, Response } from 'express';
import { SwapService } from '../services/SwapService';
import { SwapRequest } from '../types/swap.types';
import { PrismaClient } from '@prisma/client';

export class SwapController {
  private swapService: SwapService;

  constructor(prisma: PrismaClient) {
    this.swapService = new SwapService(prisma);
  }

  async executeSwap(req: Request, res: Response): Promise<void> {
    try {
      const swapRequest: SwapRequest = req.body;
      const result = await this.swapService.executeSwap(swapRequest);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      // Check if it's a validation error (minimum amount)
      if (error.message.includes('below minimum')) {
        res.status(400).json({
          success: false,
          error: {
            code: 'AMOUNT_TOO_LOW',
            message: error.message
          }
        });
        return;
      }

      // Check if it's an unsupported token error
      if (error.message.includes('Unsupported token')) {
        res.status(400).json({
          success: false,
          error: {
            code: 'UNSUPPORTED_TOKEN',
            message: error.message
          }
        });
        return;
      }

      // Generic server error
      res.status(500).json({
        success: false,
        error: {
          code: 'SWAP_FAILED',
          message: error.message
        }
      });
    }
  }

  async getSwapStatus(req: Request, res: Response): Promise<void> {
    try {
      const { intentId } = req.params;
      const status = await this.swapService.getSwapStatus(intentId);

      res.status(200).json({
        success: true,
        data: status
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        error: {
          code: 'INTENT_NOT_FOUND',
          message: error.message
        }
      });
    }
  }
}
