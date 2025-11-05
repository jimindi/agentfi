import { Router, Request, Response, NextFunction } from 'express';
import { SwapService } from '../services/swap.service';
import { QuoteService } from '../services/quote.service';
import { z } from 'zod';
import { logger } from '../utils/logger';

const router = Router();
const swapService = new SwapService();
const quoteService = new QuoteService();

// Validation schemas
const SwapRequestSchema = z.object({
  from: z.object({
    chain: z.string().min(1),
    token: z.string().min(1),
    amount: z.string().regex(/^\d+$/)
  }),
  to: z.object({
    chain: z.string().min(1),
    token: z.string().min(1),
    minAmount: z.string().regex(/^\d+$/).optional()
  }),
  user: z.object({
    walletAddress: z.string().min(20)
  }),
  options: z.object({
    slippageTolerance: z.number().min(0).max(100).optional(),
    timeoutSeconds: z.number().min(10).max(300).optional(),
    webhookUrl: z.string().url().optional()
  }).optional(),
  metadata: z.record(z.any()).optional()
});

const QuoteRequestSchema = z.object({
  from: z.object({
    chain: z.string().min(1),
    token: z.string().min(1),
    amount: z.string().regex(/^\d+$/)
  }),
  to: z.object({
    chain: z.string().min(1),
    token: z.string().min(1)
  })
});

// POST /v1/swap - Execute swap
router.post('/swap', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate request
    const validated = SwapRequestSchema.parse(req.body);

    // TODO: Add authentication middleware to get userId and apiKeyId
    // For now, use placeholder values
    const userId = 'temp-user-id';
    const apiKeyId = 'temp-api-key-id';

    const result = await swapService.executeSwap({
      fromChain: validated.from.chain,
      fromToken: validated.from.token,
      fromAmount: validated.from.amount,
      toChain: validated.to.chain,
      toToken: validated.to.token,
      minToAmount: validated.to.minAmount,
      userWalletAddress: validated.user.walletAddress,
      userId,
      apiKeyId,
      slippageTolerance: validated.options?.slippageTolerance,
      webhookUrl: validated.options?.webhookUrl,
      metadata: validated.metadata
    });

    res.status(200).json({
      success: true,
      data: {
        intentId: result.intentId,
        status: result.status,
        quote: result.quote,
        tracking: {
          statusUrl: `${req.protocol}://${req.get('host')}/v1/swap/${result.intentId}`,
          explorerUrl: result.txHash ? `https://explorer.testnet.near.org/transactions/${result.txHash}` : undefined
        }
      },
      meta: {
        requestId: req.id,
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PARAMETERS',
          message: 'Validation failed',
          details: error.errors,
          statusCode: 400
        }
      });
    }
    next(error);
  }
});

// GET /v1/swap/:intentId - Get swap status
router.get('/swap/:intentId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { intentId } = req.params;

    const status = await swapService.getSwapStatus(intentId);

    res.status(200).json({
      success: true,
      data: status
    });

  } catch (error) {
    if ((error as Error).message === 'Intent not found') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'INTENT_NOT_FOUND',
          message: `Intent with ID ${req.params.intentId} not found`,
          statusCode: 404
        }
      });
    }
    next(error);
  }
});

// POST /v1/quote - Get quote without executing
router.post('/quote', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = QuoteRequestSchema.parse(req.body);

    // Format asset IDs
    const fromAssetId = `${validated.from.chain}:${validated.from.token}`;
    const toAssetId = `${validated.to.chain}:${validated.to.token}`;

    const quote = await quoteService.getQuote({
      fromAssetId,
      toAssetId,
      amount: validated.from.amount
    });

    res.status(200).json({
      success: true,
      data: {
        quote,
        route: {
          path: [
            `${validated.from.token}@${validated.from.chain}`,
            `${validated.to.token}@${validated.to.chain}`
          ],
          hops: 1
        }
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PARAMETERS',
          message: 'Validation failed',
          details: error.errors,
          statusCode: 400
        }
      });
    }
    next(error);
  }
});

export default router;
