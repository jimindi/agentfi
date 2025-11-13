import { Router } from 'express';
import { ApiKeyController } from '../controllers/ApiKeyController';
import { authenticateApiKey } from '../middleware/auth.middleware';

const router = Router();

/**
 * POST /v2/auth/api-key
 * Create a new API key (no auth required for first key)
 */
router.post('/api-key', ApiKeyController.createApiKey);

/**
 * GET /v2/auth/api-keys
 * List API keys for authenticated user
 */
router.get('/api-keys', authenticateApiKey, ApiKeyController.listApiKeys);

/**
 * DELETE /v2/auth/api-key/:keyId
 * Revoke an API key
 */
router.delete('/api-key/:keyId', authenticateApiKey, ApiKeyController.revokeApiKey);

export default router;
