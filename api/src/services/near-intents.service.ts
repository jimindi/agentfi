import { IntentsSDK } from '@defuse-protocol/intents-sdk';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export class NEARIntentsService {
  private static instance: NEARIntentsService;
  private sdk!: IntentsSDK;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): NEARIntentsService {
    if (!NEARIntentsService.instance) {
      NEARIntentsService.instance = new NEARIntentsService();
    }
    return NEARIntentsService.instance;
  }

  async init(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      this.sdk = new IntentsSDK({
        network: env.NEAR_NETWORK as 'testnet' | 'mainnet'
      });

      logger.info({
        network: env.NEAR_NETWORK,
        accountId: env.NEAR_ACCOUNT_ID
      }, '✅ NEAR Intents SDK initialized');

      this.isInitialized = true;
    } catch (error) {
      logger.error({ error }, '❌ Failed to initialize NEAR Intents SDK');
      throw error;
    }
  }

  getSDK(): IntentsSDK {
    if (!this.isInitialized) {
      throw new Error('NEAR Intents SDK not initialized. Call init() first.');
    }
    return this.sdk;
  }

  async getSupportedTokens(): Promise<any[]> {
    try {
      const response = await fetch('https://api-mng-console.chaindefuser.com/api/tokens');
      
      if (!response.ok) {
        throw new Error(`API responded with status ${response.status}`);
      }
      
      const data = await response.json();
      
      // API uses "items" not "tokens"
      if (!data.items || !Array.isArray(data.items)) {
        throw new Error('Invalid response format');
      }
      
      return data.items.map((token: any) => ({
        defuseAssetId: token.defuse_asset_id,
        symbol: token.symbol,
        decimals: token.decimals,
        blockchain: token.blockchain,
        priceUsd: token.price,
        contractAddress: token.contract_address
      }));
    } catch (error) {
      logger.error({ error }, 'Failed to fetch supported tokens from API');
      throw error;
    }
  }
}
