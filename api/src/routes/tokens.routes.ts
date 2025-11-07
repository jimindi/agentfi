import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
  const tokens = [
    { symbol: 'wNEAR', name: 'Wrapped NEAR', chains: [{ chain: 'near', decimals: 24, priceUsd: 1.84 }] },
    { symbol: 'USDC', name: 'USD Coin', chains: [{ chain: 'near', decimals: 6, priceUsd: 1.00 }] },
    { symbol: 'USDT', name: 'Tether USD', chains: [{ chain: 'near', decimals: 6, priceUsd: 1.00 }] },
    { symbol: 'ETH', name: 'Ethereum', chains: [{ chain: 'ethereum', decimals: 18, priceUsd: 1800.00 }] }
  ];
  
  res.json({ success: true, data: { tokens, total: tokens.length } });
});

export default router;
