import { connect, keyStores, KeyPair, Near, Account } from 'near-api-js';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export class NEARClient {
  private static instance: NEARClient;
  private near!: Near;
  private account!: Account;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): NEARClient {
    if (!NEARClient.instance) {
      NEARClient.instance = new NEARClient();
    }
    return NEARClient.instance;
  }

  async init(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Setup keystore
      const keyStore = new keyStores.InMemoryKeyStore();
      const keyPair = KeyPair.fromString(env.NEAR_PRIVATE_KEY);
      await keyStore.setKey(
        env.NEAR_NETWORK,
        env.NEAR_ACCOUNT_ID,
        keyPair
      );

      // NEAR configuration
      const config = {
        networkId: env.NEAR_NETWORK,
        keyStore,
        nodeUrl: env.NEAR_NETWORK === 'mainnet'
          ? 'https://rpc.mainnet.near.org'
          : 'https://rpc.testnet.near.org',
        walletUrl: env.NEAR_NETWORK === 'mainnet'
          ? 'https://wallet.near.org'
          : 'https://testnet.mynearwallet.com',
        helperUrl: env.NEAR_NETWORK === 'mainnet'
          ? 'https://helper.mainnet.near.org'
          : 'https://helper.testnet.near.org',
        explorerUrl: env.NEAR_NETWORK === 'mainnet'
          ? 'https://explorer.near.org'
          : 'https://explorer.testnet.near.org'
      };

      // Connect to NEAR
      this.near = await connect(config);
      this.account = await this.near.account(env.NEAR_ACCOUNT_ID);

      // Verify account exists
      const accountState = await this.account.state();
      
      logger.info({
        accountId: env.NEAR_ACCOUNT_ID,
        network: env.NEAR_NETWORK,
        balance: accountState.amount
      }, '✅ NEAR client initialized');

      this.isInitialized = true;
    } catch (error) {
      logger.error({ error }, '❌ Failed to initialize NEAR client');
      throw error;
    }
  }

  getAccount(): Account {
    if (!this.isInitialized) {
      throw new Error('NEAR client not initialized. Call init() first.');
    }
    return this.account;
  }

  getNear(): Near {
    if (!this.isInitialized) {
      throw new Error('NEAR client not initialized. Call init() first.');
    }
    return this.near;
  }

  // View function (read-only, no gas cost)
  async viewFunction(
    contractId: string,
    methodName: string,
    args: any = {}
  ): Promise<any> {
    try {
      const result = await this.account.viewFunction({
        contractId,
        methodName,
        args
      });
      return result;
    } catch (error) {
      logger.error({ 
        error, 
        contractId, 
        methodName, 
        args 
      }, 'View function call failed');
      throw error;
    }
  }

  // Change function (write, costs gas)
  async callFunction(
    contractId: string,
    methodName: string,
    args: any = {},
    gas: string = '30000000000000', // 30 TGas
    attachedDeposit: string = '0'
  ): Promise<any> {
    try {
      const result = await this.account.functionCall({
        contractId,
        methodName,
        args,
        gas,
        attachedDeposit
      });
      return result;
    } catch (error) {
      logger.error({ 
        error, 
        contractId, 
        methodName, 
        args 
      }, 'Function call failed');
      throw error;
    }
  }

  // Get account balance
  async getBalance(): Promise<string> {
    const state = await this.account.state();
    return state.amount;
  }
}
