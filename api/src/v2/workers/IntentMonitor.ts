import { PrismaClient } from '@prisma/client';
import oneClickService from '../services/OneClickService';

const prisma = new PrismaClient();

class IntentMonitor {
  private intervalId?: NodeJS.Timeout;

  start() {
    console.log('Starting Intent Monitor worker...');
    
    // Check immediately on start
    this.checkPendingIntents();
    
    // Then check every 20 seconds
    this.intervalId = setInterval(() => {
      this.checkPendingIntents();
    }, 20000);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      console.log('Intent Monitor worker stopped');
    }
  }

  private async checkPendingIntents() {
    try {
      const intents = await prisma.intent.findMany({
        where: {
          status: {
            in: ['pending_deposit', 'executing']
          }
        }
      });

      console.log(`Found ${intents.length} pending intents to check`);

      for (const intent of intents) {
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
        
        console.log(`Intent ${intent.id} completed!`);
      } else if (status.status === 'FAILED') {
        await prisma.intent.update({
          where: { id: intent.id },
          data: {
            status: 'failed',
            errorMessage: 'Swap execution failed'
          }
        });
        
        console.log(`Intent ${intent.id} failed`);
      } else {
        console.log(`Intent ${intent.id} still ${status.status}`);
      }
    } catch (error) {
      console.error(`Error checking intent ${intent.id}:`, error);
    }
  }
}

export default new IntentMonitor();
