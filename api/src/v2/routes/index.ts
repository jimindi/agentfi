import { Router } from 'express';
import swapRoutes from './swap.routes';
import authRoutes from './auth.routes';

const router = Router();

// Mount routes
router.use('/swap', swapRoutes);
router.use('/auth', authRoutes);

// Root endpoint
router.get('/', (req, res) => {
  res.json({
    name: 'AgentFi Cross-Chain Swap API v2',
    version: '2.0.0',
    endpoints: {
      'POST /v2/swap': 'Execute cross-chain swap (requires API key)',
      'GET /v2/swap/:id': 'Get swap status (public)',
      'POST /v2/auth/api-key': 'Create API key (public)',
      'GET /v2/auth/api-keys': 'List API keys (requires API key)',
      'DELETE /v2/auth/api-key/:id': 'Revoke API key (requires API key)',
    },
  });
});

export default router;
