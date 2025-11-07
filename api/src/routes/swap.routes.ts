import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { swapService } from '../services/swap.service';
import { logger } from '../utils/logger';

const router = Router();

const NEP413SignedDataSchema = z.object({
  standard: z.string(),
  payload: z.object({
    message: z.string(),
    nonce: z.string(),
    recipient: z.string(),
  }),
  public_key: z.string(),
  signature: z.string(),
});

const SwapRequestSchema = z.object({
  from: z.object({
    chain: z.string(),
    token: z.string(),
    amount: z.string().regex(/^\d+$/),
  }),
  to: z.object({
    chain: z.string(),
    token: z.string(),
    minAmount: z.string().regex(/^\d+$/).optional(),
  }),
  user: z.object({
    walletAddress: z.string(),
  }),
  signedIntent: NEP413SignedDataSchema,
  options: z
    .object({
      slippageTolerance: z.number().min(0).max(100).optional(),
      webhookUrl: z.string().url().optional(),
    })
    .optional(),
  metadata: z.record(z.any()).optional(),
});

const QuoteRequestSchema = z.object({
  from: z.object({
    chain: z.string(),
    token: z.string(),
    amount: z.string().regex(/^\d+$/),
  }),
  to: z.object({
    chain: z.string(),
    token: z.string(),
  }),
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const validated = SwapRequestSchema.parse(req.body);
    
    logger.info(
      {
        from: validated.from,
        to: validated.to,
        user: validated.user.walletAddress,
        hasSignedIntent: !!validated.signedIntent,
        signedIntentStandard: validated.signedIntent.standard,
      },
      'Swap request received with NEP-413 signed intent'
    );

    const result = await swapService.executeSwap({
      ...validated,
      metadata: {
        ...validated.metadata,
        signedIntent: validated.signedIntent,
      },
    });

    res.json(result);
  } catch (error: any) {
    logger.error({ error, body: req.body }, 'Swap request failed');
    
    if (error instanceof z.ZodError) {
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

    res.status(500).json({
      success: false,
      error: {
        code: 'SWAP_FAILED',
        message: error?.message || 'Swap execution failed',
        statusCode: 500,
      },
    });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    logger.info({ intentId: id }, 'Status check requested');
    
    const result = await swapService.getSwapStatus(id);
    res.json(result);
  } catch (error: any) {
    logger.error({ error, intentId: req.params.id }, 'Status check failed');
    
    if (error?.message === 'Intent not found') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'INTENT_NOT_FOUND',
          message: `Intent with ID ${req.params.id} not found`,
          statusCode: 404,
        },
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve swap status',
        statusCode: 500,
      },
    });
  }
});

router.post('/quote', async (req: Request, res: Response) => {
  try {
    const validated = QuoteRequestSchema.parse(req.body);
    const result = await swapService.getQuote(validated);
    res.json(result);
  } catch (error: any) {
    logger.error({ error }, 'Quote request failed');
    
    if (error instanceof z.ZodError) {
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

    res.status(500).json({
      success: false,
      error: {
        code: 'QUOTE_FAILED',
        message: error?.message || 'Quote generation failed',
        statusCode: 500,
      },
    });
  }
});

export default router;
