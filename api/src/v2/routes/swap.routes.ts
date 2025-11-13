import { Router } from 'express';
import { SwapController } from '../controllers/SwapController';
import { authenticateApiKey } from '../middleware/auth.middleware';
import { swapRateLimiter } from '../services/RateLimitService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const swapController = new SwapController(prisma);
const router = Router();

/**
 * Routes mounted at /v2/swap
 * 
 * POST /v2/swap - Execute swap (authenticated, rate limited)
 * GET /v2/swap/:intentId - Get status (public)
 */

// POST /v2/swap (requires authentication + rate limiting)
router.post(
  '/',
  authenticateApiKey,
  swapRateLimiter,
  (req, res) => swapController.executeSwap(req, res)
);

// GET /v2/swap/:intentId (public)
router.get(
  '/:intentId',
  (req, res) => swapController.getSwapStatus(req, res)
);

export default router;
