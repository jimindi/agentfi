import { Router } from 'express';
import { TokenController } from '../controllers/TokenController';
import tokenService from '../services/TokenService';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Initialize TokenController with singleton instance
const tokenController = new TokenController(tokenService);

/**
 * @route GET /v2/tokens
 * @desc List all supported tokens with optional filtering
 * @query chain - Filter by blockchain (e.g., "near", "ethereum")
 * @query symbol - Filter by symbol (partial match, case-insensitive)
 * @access Public
 */
router.get(
  '/',
  asyncHandler((req, res) => tokenController.listTokens(req, res))
);

/**
 * @route GET /v2/tokens/chains
 * @desc Get list of supported blockchains with token counts
 * @access Public
 */
router.get(
  '/chains',
  asyncHandler((req, res) => tokenController.getChains(req, res))
);

/**
 * @route GET /v2/tokens/search
 * @desc Search tokens by symbol
 * @query q - Search query (required)
 * @query chain - Optional blockchain filter
 * @access Public
 */
router.get(
  '/search',
  asyncHandler((req, res) => tokenController.searchTokens(req, res))
);

/**
 * @route GET /v2/tokens/:assetId
 * @desc Get token details by assetId
 * @param assetId - Token asset ID (e.g., "nep141:wrap.near")
 * @access Public
 */
router.get(
  '/:assetId',
  asyncHandler((req, res) => tokenController.getToken(req, res))
);

export default router;
