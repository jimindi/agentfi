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
