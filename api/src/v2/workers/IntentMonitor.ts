import { PrismaClient } from '@prisma/client';
import { OneClickService } from '../services/OneClickService';

const prisma = new PrismaClient();
const oneClickService = new OneClickService();

export class IntentMonitor {
  private pollInterval: NodeJS.Timeout | null = null;
  private isRunning = false;

  async start() {
    if (this.isRunning) {
      console.log('Intent monitor already running');
      return;
    }

    this.isRunning = true;
    console.log('Starting intent monitor...');
    
    this.pollInterval = setInterval(() => this.checkPendingIntents(), 20000);
    await this.checkPendingIntents();
  }

  stop() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.isRunning = false;
    console.log('Intent monitor stopped');
  }

  private async checkPendingIntents() {
    try {
      const pendingIntents = await prisma.intent.findMany({
        where: {
          status: { in: ['pending_deposit', 'deposited', 'executing'] }
        }
      });

      console.log(`Checking ${pendingIntents.length} pending intents`);

      for (const intent of pendingIntents) {
        await this.checkIntent(intent);
      }
    } catch (error) {
      console.error('Error checking pending intents:', error);
    }
  }

  private async checkIntent(intent: any) {
    try {
      const depositAddress = intent.metadata?.depositAddress;
      if (!depositAddress) {
        console.log(`Intent ${intent.id} has no deposit address`);
        return;
      }

      console.log(`Checking status for intent ${intent.id}, deposit: ${depositAddress}`);
      const status = await oneClickService.getExecutionStatus(depositAddress);
      console.log(`Status for ${intent.id}: ${status.status}`);

      if (status.status === 'SUCCESS') {
        await prisma.intent.update({
          where: { id: intent.id },
          data: {
            status: 'completed',
            txHash: status.swapDetails?.nearTxHashes?.[1],
            actualOutputAmount: status.swapDetails?.amountOut,
            completedAt: new Date()
          }
        });
        console.log(`Intent ${intent.id} completed`);
      } else if (status.status === 'FAILED') {
        await prisma.intent.update({
          where: { id: intent.id },
          data: {
            status: 'failed',
            errorMessage: status.error || 'Swap failed'
          }
        });
        console.log(`Intent ${intent.id} failed`);
      } else if (status.status === 'EXECUTING') {
        if (intent.status !== 'executing') {
          await prisma.intent.update({
            where: { id: intent.id },
            data: { status: 'executing' }
          });
          console.log(`Intent ${intent.id} now executing`);
        }
      }
    } catch (error) {
      console.error(`Error checking intent ${intent.id}:`, error);
    }
  }
}
