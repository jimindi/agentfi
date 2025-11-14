import { Router } from 'express';
import { SwapController } from '../controllers/SwapController';
import { TokenService } from '../services/TokenService';
import TokenPriceService from '../services/TokenPriceService';
import { authenticateApiKey } from '../middleware/auth.middleware';
import { swapRateLimiter } from '../services/RateLimitService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Initialize services
const tokenService = new TokenService();
const tokenPriceService = new TokenPriceService(tokenService);
const swapController = new SwapController(prisma, tokenService, tokenPriceService);

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
  (req, res, next) => swapController.executeSwap(req, res, next)
);

// GET /v2/swap/:intentId (public)
router.get(
  '/:intentId',
  (req, res, next) => swapController.getSwapStatus(req, res, next)
);

export default router;
