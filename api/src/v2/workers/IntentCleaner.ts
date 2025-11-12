import { PrismaClient } from '@prisma/client';
import { logger } from '../../utils/logger';

const prisma = new PrismaClient();

export class IntentCleaner {
  private readonly EXPIRATION_HOURS = 24; // Expire after 24 hours
  
  async cleanExpiredIntents(): Promise<void> {
    const expirationTime = new Date(Date.now() - this.EXPIRATION_HOURS * 60 * 60 * 1000);
    
    try {
      // Find all pending_deposit intents older than expiration time
      const expiredIntents = await prisma.intent.findMany({
        where: {
          status: 'pending_deposit',
          createdAt: {
            lt: expirationTime
          }
        }
      });

      if (expiredIntents.length === 0) {
        logger.debug('No expired intents to clean');
        return;
      }

      logger.info(`Found ${expiredIntents.length} expired intents, marking as expired`);

      // Mark them as expired
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

      logger.info(`Marked ${result.count} intents as expired`);

    } catch (error) {
      logger.error({ error }, 'Error cleaning expired intents');
    }
  }

  start(): void {
    logger.info('Starting Intent Cleaner (runs every 1 hour)');
    
    // Run immediately
    this.cleanExpiredIntents();
    
    // Run every hour
    setInterval(() => {
      this.cleanExpiredIntents();
    }, 60 * 60 * 1000);
  }
}
