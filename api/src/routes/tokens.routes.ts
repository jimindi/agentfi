import { Router, Request, Response } from 'express';
import { NEARIntentsService } from '../services/near-intents.service';
import { logger } from '../utils/logger';

const router = Router();
const nearIntents = NEARIntentsService.getInstance();

// GET /v1/tokens - List supported tokens
router.get('/tokens', async (req: Request, res: Response) => {
  try {
    const { chain, search } = req.query;

    // Get tokens from NEAR Intents
    const tokens = await nearIntents.getSupportedTokens();

    // Filter by chain if specified
    let filteredTokens = tokens;
    if (chain) {
      filteredTokens = tokens.filter(t => 
        t.blockchain.toLowerCase() === (chain as string).toLowerCase()
      );
    }

    // Filter by search term if specified
    if (search) {
      const searchTerm = (search as string).toLowerCase();
      filteredTokens = filteredTokens.filter(t =>
        t.symbol.toLowerCase().includes(searchTerm) ||
        t.defuseAssetId.toLowerCase().includes(searchTerm)
      );
    }

    res.json({
      success: true,
      data: {
        tokens: filteredTokens.map(t => ({
          symbol: t.symbol,
          defuseAssetId: t.defuseAssetId,
          decimals: t.decimals,
          blockchain: t.blockchain,
          priceUsd: t.priceUsd
        })),
        total: filteredTokens.length
      }
    });

  } catch (error) {
    logger.error({ error }, 'Failed to fetch tokens');
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch supported tokens'
      }
    });
  }
});

// GET /v1/chains - List supported chains
router.get('/chains', async (req: Request, res: Response) => {
  try {
    // For now, return hardcoded supported chains
    // In production, this would come from NEAR Intents API
    const chains = [
      {
        id: 'near',
        name: 'NEAR Protocol',
        type: 'near',
        network: 'mainnet',
        explorerUrl: 'https://explorer.near.org',
        nativeToken: {
          symbol: 'NEAR',
          decimals: 24
        },
        status: 'operational'
      },
      {
        id: 'ethereum',
        name: 'Ethereum',
        type: 'evm',
        network: 'mainnet',
        explorerUrl: 'https://etherscan.io',
        nativeToken: {
          symbol: 'ETH',
          decimals: 18
        },
        status: 'operational'
      },
      {
        id: 'solana',
        name: 'Solana',
        type: 'svm',
        network: 'mainnet',
        explorerUrl: 'https://solscan.io',
        nativeToken: {
          symbol: 'SOL',
          decimals: 9
        },
        status: 'operational'
      },
      {
        id: 'bitcoin',
        name: 'Bitcoin',
        type: 'utxo',
        network: 'mainnet',
        explorerUrl: 'https://blockchain.com',
        nativeToken: {
          symbol: 'BTC',
          decimals: 8
        },
        status: 'operational'
      }
    ];

    res.json({
      success: true,
      data: {
        chains,
        total: chains.length
      }
    });

  } catch (error) {
    logger.error({ error }, 'Failed to fetch chains');
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch supported chains'
      }
    });
  }
});

export default router;
