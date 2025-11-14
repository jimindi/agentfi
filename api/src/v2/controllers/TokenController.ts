import { Request, Response } from 'express';
import { TokenService } from '../services/TokenService';
import { ValidationError } from '../errors';

export class TokenController {
  constructor(private tokenService: TokenService) {}

  /**
   * List all tokens with optional filtering
   * GET /v2/tokens?chain=near&symbol=USDC
   */
  async listTokens(req: Request, res: Response): Promise<void> {
    try {
      const { chain, symbol } = req.query;

      let tokens = this.tokenService.getAllTokens();

      // Filter by chain if provided
      if (chain && typeof chain === 'string') {
        tokens = tokens.filter(token => 
          token.blockchain.toLowerCase() === chain.toLowerCase()
        );
      }

      // Filter by symbol if provided (case-insensitive partial match)
      if (symbol && typeof symbol === 'string') {
        tokens = tokens.filter(token =>
          token.symbol.toLowerCase().includes(symbol.toLowerCase())
        );
      }

      // Sort by blockchain and symbol for consistent ordering
      tokens.sort((a, b) => {
        if (a.blockchain !== b.blockchain) {
          return a.blockchain.localeCompare(b.blockchain);
        }
        return a.symbol.localeCompare(b.symbol);
      });

      res.json({
        success: true,
        data: {
          tokens: tokens.map(token => ({
            assetId: token.assetId,
            symbol: token.symbol,
            blockchain: token.blockchain,
            decimals: token.decimals,
            contractAddress: token.contractAddress,
            priceUsd: token.priceUsd,
            icon: token.icon,
          })),
          total: tokens.length,
          filters: {
            chain: chain || null,
            symbol: symbol || null,
          },
        },
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get supported blockchains
   * GET /v2/tokens/chains
   */
  async getChains(req: Request, res: Response): Promise<void> {
    try {
      const blockchains = this.tokenService.getBlockchains();

      // Count tokens per blockchain
      const tokens = this.tokenService.getAllTokens();
      const chainCounts = blockchains.map(chain => ({
        name: chain,
        tokenCount: tokens.filter(t => t.blockchain === chain).length,
      }));

      // Sort by token count (descending)
      chainCounts.sort((a, b) => b.tokenCount - a.tokenCount);

      res.json({
        success: true,
        data: {
          blockchains: chainCounts,
          total: blockchains.length,
        },
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get token details by assetId
   * GET /v2/tokens/:assetId
   */
  async getToken(req: Request, res: Response): Promise<void> {
    try {
      const { assetId } = req.params;

      if (!assetId) {
        throw new ValidationError('Asset ID is required');
      }

      const token = this.tokenService.findByAssetId(assetId);

      if (!token) {
        throw new ValidationError(`Token with assetId "${assetId}" not found`);
      }

      res.json({
        success: true,
        data: {
          token: {
            assetId: token.assetId,
            symbol: token.symbol,
            blockchain: token.blockchain,
            decimals: token.decimals,
            contractAddress: token.contractAddress,
            priceUsd: token.priceUsd,
            icon: token.icon,
          },
        },
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Search tokens by symbol
   * GET /v2/tokens/search?q=USDC&chain=near
   */
  async searchTokens(req: Request, res: Response): Promise<void> {
    try {
      const { q, chain } = req.query;

      if (!q || typeof q !== 'string') {
        throw new ValidationError('Search query parameter "q" is required');
      }

      const chainStr = chain && typeof chain === 'string' ? chain : undefined;
      const tokens = this.tokenService.findBySymbol(q, chainStr);

      res.json({
        success: true,
        data: {
          tokens: tokens.map(token => ({
            assetId: token.assetId,
            symbol: token.symbol,
            blockchain: token.blockchain,
            decimals: token.decimals,
            contractAddress: token.contractAddress,
            priceUsd: token.priceUsd,
            icon: token.icon,
          })),
          total: tokens.length,
          query: {
            search: q,
            chain: chainStr || null,
          },
        },
      });
    } catch (error) {
      throw error;
    }
  }
}
