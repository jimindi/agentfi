import { connect, keyStores, KeyPair, Near, Account } from 'near-api-js';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export class NEARContractService {
  private near: Near | null = null;
  private account: Account | null = null;

  async init() {
    logger.info('Initializing NEAR contract service...');

    const keyStore = new keyStores.InMemoryKeyStore();
    const keyPair = KeyPair.fromString(env.NEAR_PRIVATE_KEY);
    
    await keyStore.setKey(
      env.NEAR_NETWORK,
      env.NEAR_ACCOUNT_ID,
      keyPair
    );

    logger.info('Key added to keystore');

    this.near = await connect({
      networkId: env.NEAR_NETWORK,
      keyStore,
      nodeUrl:
        env.NEAR_NETWORK === 'mainnet'
          ? 'https://rpc.mainnet.near.org'
          : 'https://rpc.testnet.near.org',
    });

    this.account = await this.near.account(env.NEAR_ACCOUNT_ID);

    logger.info('NEAR contract service initialized');
  }

  async checkBalance(params: { userAccountId: string; tokenIds: string[] }): Promise<string[]> {
    if (!this.account) throw new Error('NEAR not initialized');

    logger.info('Checking balance in intents.near', {
      user: params.userAccountId,
      tokens: params.tokenIds,
    });

    const result = await this.account.viewFunction({
      contractId: 'intents.near',
      methodName: 'mt_batch_balance_of',
      args: {
        account_id: params.userAccountId,
        token_ids: params.tokenIds,
      },
    });

    logger.info('Balance check complete', {
      user: params.userAccountId,
      balances: result,
    });

    return result;
  }

  async executeIntentWithNEP413(signedIntent: any): Promise<{ txHash: string }> {
    if (!this.account) throw new Error('NEAR not initialized');

    logger.info('Executing with NEP-413 signed data');

    try {
      // Contract expects: { intents: [array of intents] }
      const args = {
        intents: [signedIntent]  // Named parameter with array
      };

      logger.info('Sending to execute_intents', { args });

      const result = await this.account.functionCall({
        contractId: 'intents.near',
        methodName: 'execute_intents',
        args: args,
        gas: '300000000000000',
        attachedDeposit: '0',
      });

      logger.info('NEP-413 intent executed successfully', {
        txHash: result.transaction.hash,
      });

      return {
        txHash: result.transaction.hash,
      };
    } catch (error: any) {
      logger.error('Failed to execute NEP-413 intent', {
        error: error.message || String(error),
      });
      throw error;
    }
  }

  buildIntentMessage(params: {
    userAccountId: string;
    fromAssetId: string;
    toAssetId: string;
    amountIn: string;
    amountOut: string;
    deadline: string;
  }) {
    return {
      signer_id: params.userAccountId,
      deadline: params.deadline,
      intents: [
        {
          intent: 'token_diff',
          diff: {
            [params.fromAssetId]: `-${params.amountIn}`,
            [params.toAssetId]: params.amountOut,
          },
        },
      ],
    };
  }

  async generateDepositInstructions(params: {
    userAccountId: string;
    tokenContractId: string;
    amount: string;
  }) {
    const args = {
      receiver_id: 'intents.near',
      amount: params.amount,
      msg: JSON.stringify({ receiver_id: params.userAccountId }),
    };

    const cliCommand = `near call ${params.tokenContractId} ft_transfer_call '${JSON.stringify(args).replace(/"/g, '\\"')}' --accountId ${params.userAccountId} --depositYocto 1 --gas 300000000000000`;

    return {
      contractId: params.tokenContractId,
      methodName: 'ft_transfer_call',
      args,
      gas: '300000000000000',
      deposit: '1',
      cliCommand,
    };
  }
}

export const nearContractService = new NEARContractService();
