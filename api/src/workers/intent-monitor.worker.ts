import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { NEARContractService } from '../services/near-contract.service';
import { OpenAPI, OneClickService } from '@defuse-protocol/one-click-sdk-typescript';
import { env } from '../config/env';

const prisma = new PrismaClient();

export class IntentMonitorWorker {
  private contractService: NEARContractService;
  private checkInterval = 20000; // 20 seconds
  private intervalId: NodeJS.Timeout | null = null;

  constructor() {
    this.contractService = new NEARContractService();
    
    // Initialize OneClick SDK
    OpenAPI.BASE = 'https://1click.chaindefuser.com';
    OpenAPI.TOKEN = env.ONECLICK_JWT_TOKEN || '';
  }

  async start() {
    logger.info('Starting intent monitor worker...');
    
    await this.contractService.init();
    
    logger.info('✅ Intent Monitor Worker started successfully');
    
    // Start monitoring loop
    this.intervalId = setInterval(() => this.checkPendingIntents(), this.checkInterval);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      logger.info('Intent monitor worker stopped');
    }
  }

  private async checkPendingIntents() {
    try {
      const pendingIntents = await prisma.intent.findMany({
        where: {
          status: { in: ['pending_deposit', 'deposited', 'executing'] }
        },
        orderBy: { createdAt: 'asc' }
      });

      if (pendingIntents.length === 0) return;

      logger.info({ count: pendingIntents.length }, 'Checking pending intents');

      for (const intent of pendingIntents) {
        try {
          await this.processIntent(intent);
        } catch (error) {
          logger.error(
            { error, intentId: intent.id },
            'Error processing individual intent'
          );
        }
      }
    } catch (error) {
      logger.error({ error }, 'Error checking pending intents');
    }
  }

  private async processIntent(intent: any) {
    logger.info({ intentId: intent.id, status: intent.status }, 'Processing intent');

    // Check deposit address from quote
    const quote = intent.metadata?.quote;
    if (!quote || !quote.depositAddress) {
      logger.warn({ intentId: intent.id }, 'No deposit address in quote');
      return;
    }

    const depositAddress = quote.depositAddress;

    // Check execution status via OneClick API
    try {
      const status = await OneClickService.getExecutionStatus(depositAddress);
      
      logger.info({ 
        intentId: intent.id, 
        depositAddress,
        apiStatus: status.status 
      }, 'Execution status from OneClick API');

      // Update based on status - OneClick returns 'SUCCESS' not 'COMPLETED'
      if (status.status === 'SUCCESS' || status.status === 'COMPLETED') {
        const txHash = status.swapDetails?.nearTxHashes?.[1] || 
                       status.swapDetails?.destinationChainTxHashes?.[0]?.hash ||
                       status.txHash;
        
        const outputAmount = status.swapDetails?.amountOut;
        
        await prisma.intent.update({
          where: { id: intent.id },
          data: {
            status: 'completed',
            txHash: txHash,
            actualOutputAmount: outputAmount,
            completedAt: new Date(),
            executionTimeMs: Date.now() - intent.createdAt.getTime()
          }
        });
        
        logger.info({ 
          intentId: intent.id, 
          txHash,
          outputAmount 
        }, '✅ Swap completed successfully');
        
      } else if (status.status === 'FAILED') {
        await prisma.intent.update({
          where: { id: intent.id },
          data: {
            status: 'failed',
            errorMessage: status.error || 'Swap failed'
          }
        });
        
        logger.error({ intentId: intent.id, error: status.error }, 'Swap failed');
        
      } else if (status.status === 'PENDING' || status.status === 'EXECUTING' || status.status === 'PENDING_DEPOSIT') {
        // Still in progress
        if (intent.status !== 'executing' && status.status !== 'PENDING_DEPOSIT') {
          await prisma.intent.update({
            where: { id: intent.id },
            data: { status: 'executing' }
          });
        }
        logger.debug({ intentId: intent.id, apiStatus: status.status }, 'Swap in progress');
      }
      
    } catch (error: any) {
      // If we get 404, the swap hasn't been detected yet
      if (error.status === 404) {
        logger.debug({ intentId: intent.id, depositAddress }, 'Deposit not detected yet by OneClick API');
      } else {
        logger.error({ error, intentId: intent.id }, 'Error checking execution status');
      }
    }
  }
}

// Export singleton instance
export const intentMonitorWorker = new IntentMonitorWorker();
