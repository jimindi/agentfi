import { Router } from 'express';
import { ApiKeyController } from '../controllers/ApiKeyController';
import { authenticate } from '../middleware/auth.middleware';
import { authRateLimiter } from '../services/RateLimitService';

const router = Router();

/**
 * POST /v2/auth/api-key
 * Create a new API key (no auth required for first key, rate limited)
 */
router.post('/api-key', authRateLimiter, ApiKeyController.createApiKey);

/**
 * GET /v2/auth/api-keys
 * List API keys for authenticated user
 */
router.get('/api-keys', authenticate, ApiKeyController.listApiKeys);

/**
 * DELETE /v2/auth/api-key/:keyId
 * Revoke an API key
 */
router.delete('/api-key/:keyId', authenticate, ApiKeyController.revokeApiKey);

export default router;
