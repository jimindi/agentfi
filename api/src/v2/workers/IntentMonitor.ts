import { PrismaClient } from '@prisma/client';
import oneClickService from '../services/OneClickService';
import { WebhookService } from '../services/WebhookService';

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
        // Update database
        const updatedIntent = await prisma.intent.update({
          where: { id: intent.id },
          data: {
            status: 'completed',
            txHash: status.swapDetails?.nearTxHashes?.[1],
            actualOutputAmount: status.swapDetails?.amountOut,
            completedAt: new Date()
          }
        });
        
        console.log(`Intent ${intent.id} completed!`);

        // Send webhook if URL provided
        await this.sendWebhook(updatedIntent, 'completed');

      } else if (status.status === 'FAILED') {
        // Update database
        const updatedIntent = await prisma.intent.update({
          where: { id: intent.id },
          data: {
            status: 'failed',
            errorMessage: 'Swap execution failed'
          }
        });
        
        console.log(`Intent ${intent.id} failed`);

        // Send webhook if URL provided
        await this.sendWebhook(updatedIntent, 'failed');

      } else {
        console.log(`Intent ${intent.id} still ${status.status}`);
      }
    } catch (error) {
      console.error(`Error checking intent ${intent.id}:`, error);
    }
  }

  private async sendWebhook(intent: any, eventType: 'completed' | 'failed') {
    const webhookUrl = intent.webhookUrl;
    
    if (!webhookUrl) {
      console.log(`No webhook URL for intent ${intent.id}`);
      return;
    }

    console.log(`Sending ${eventType} webhook for intent ${intent.id} to ${webhookUrl}`);

    try {
      const payload = eventType === 'completed'
        ? WebhookService.createSwapCompletedPayload(intent)
        : WebhookService.createSwapFailedPayload(intent);

      const success = await WebhookService.sendWebhook(webhookUrl, payload);

      if (success) {
        console.log(`Webhook delivered successfully for intent ${intent.id}`);
      } else {
        console.error(`Webhook delivery failed for intent ${intent.id}`);
      }
    } catch (error) {
      console.error(`Error sending webhook for intent ${intent.id}:`, error);
    }
  }
}

export default new IntentMonitor();
