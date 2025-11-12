import { PrismaClient } from '@prisma/client';
import oneClickService from '../services/OneClickService';
import { WebhookService } from '../services/WebhookService';

const prisma = new PrismaClient();

class IntentMonitor {
  private intervalId?: NodeJS.Timeout;
  private readonly EXPIRATION_HOURS = 24;

  start() {
    console.log('Starting Intent Monitor worker...');
    
    // Check immediately on start
    this.checkPendingIntents();
    
    // Check for expired intents immediately
    this.cleanExpiredIntents();
    
    // Then check every 20 seconds
    this.intervalId = setInterval(() => {
      this.checkPendingIntents();
    }, 20000);

    // Clean expired intents every hour
    setInterval(() => {
      this.cleanExpiredIntents();
    }, 60 * 60 * 1000);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      console.log('Intent Monitor worker stopped');
    }
  }

  private async cleanExpiredIntents() {
    try {
      const expirationTime = new Date(Date.now() - this.EXPIRATION_HOURS * 60 * 60 * 1000);
      
      const expiredIntents = await prisma.intent.findMany({
        where: {
          status: 'pending_deposit',
          createdAt: {
            lt: expirationTime
          }
        }
      });

      if (expiredIntents.length > 0) {
        console.log(`Found ${expiredIntents.length} expired intents, marking as expired`);
        
        const result = await prisma.intent.updateMany({
          where: {
            status: 'pending_deposit',
            createdAt: {
              lt: expirationTime
            }
          },
          data: {
            status: 'expired',
            errorMessage: `Intent expired after ${this.EXPIRATION_HOURS} hours without deposit`
          }
        });

        console.log(`Marked ${result.count} intents as expired`);
      }
    } catch (error) {
      console.error('Error cleaning expired intents:', error);
    }
  }

  private async checkPendingIntents() {
    try {
      // Only check pending_deposit and executing (skip expired)
      const intents = await prisma.intent.findMany({
        where: {
          status: {
            in: ['pending_deposit', 'executing']
          }
        }
      });

      if (intents.length > 0) {
        console.log(`Found ${intents.length} pending intents to check`);
      }

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

      } else if (status.status === 'PROCESSING') {
        // Update to executing if currently pending_deposit
        if (intent.status === 'pending_deposit') {
          await prisma.intent.update({
            where: { id: intent.id },
            data: { status: 'executing' }
          });
          console.log(`Intent ${intent.id} now executing`);
        }
      } else {
        // Still pending deposit - only log if verbose
        // console.log(`Intent ${intent.id} still ${status.status}`);
      }
    } catch (error) {
      console.error(`Error checking intent ${intent.id}:`, error);
    }
  }

  private async sendWebhook(intent: any, eventType: 'completed' | 'failed') {
    const webhookUrl = intent.webhookUrl;
    
    if (!webhookUrl) {
      return; // No webhook URL, skip silently
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
