import crypto from 'crypto';
import { logger } from '../utils/logger';
import { env } from '../config/env';

export interface WebhookEvent {
  event: string;
  eventId: string;
  timestamp: string;
  data: any;
}

export class WebhookService {
  private readonly secret: string;
  private readonly maxRetries: number = 3;
  private readonly retryDelay: number = 5000; // 5 seconds

  constructor() {
    this.secret = env.WEBHOOK_SECRET;
  }

  /**
   * Generate HMAC signature for webhook payload
   */
  private generateSignature(payload: string): string {
    return crypto
      .createHmac('sha256', this.secret)
      .update(payload)
      .digest('hex');
  }

  /**
   * Verify webhook signature (for testing/validation)
   */
  public verifySignature(payload: string, signature: string): boolean {
    const expectedSignature = this.generateSignature(payload);
    
    // Constant-time comparison to prevent timing attacks
    try {
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(`sha256=${expectedSignature}`)
      );
    } catch {
      return false;
    }
  }

  /**
   * Send webhook with retry logic
   */
  public async sendWebhook(
    url: string,
    event: WebhookEvent,
    attempt: number = 1
  ): Promise<boolean> {
    const payloadString = JSON.stringify(event);
    const signature = this.generateSignature(payloadString);

    try {
      logger.info(
        { url, eventId: event.eventId, attempt },
        'Sending webhook'
      );

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-AgentFi-Signature': `sha256=${signature}`,
          'X-AgentFi-Event': event.event,
          'X-AgentFi-Event-ID': event.eventId,
          'X-AgentFi-Timestamp': event.timestamp,
          'User-Agent': 'AgentFi-Webhook/1.0'
        },
        body: payloadString,
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      if (response.ok) {
        logger.info(
          { url, eventId: event.eventId, status: response.status },
          'Webhook delivered successfully'
        );
        return true;
      }

      // Non-2xx response
      logger.warn(
        { 
          url, 
          eventId: event.eventId, 
          status: response.status,
          attempt 
        },
        'Webhook delivery failed with non-2xx status'
      );

      // Retry on 5xx errors
      if (response.status >= 500 && attempt < this.maxRetries) {
        return this.retryWebhook(url, event, attempt);
      }

      return false;

    } catch (error) {
      logger.error(
        { 
          error, 
          url, 
          eventId: event.eventId, 
          attempt 
        },
        'Webhook delivery error'
      );

      // Retry on network errors
      if (attempt < this.maxRetries) {
        return this.retryWebhook(url, event, attempt);
      }

      return false;
    }
  }

  /**
   * Retry webhook with exponential backoff
   */
  private async retryWebhook(
    url: string,
    event: WebhookEvent,
    attempt: number
  ): Promise<boolean> {
    const delay = this.retryDelay * Math.pow(2, attempt - 1);
    
    logger.info(
      { url, eventId: event.eventId, attempt: attempt + 1, delay },
      'Retrying webhook after delay'
    );

    await new Promise(resolve => setTimeout(resolve, delay));
    return this.sendWebhook(url, event, attempt + 1);
  }

  /**
   * Send swap completion webhook
   */
  public async sendSwapCompletedWebhook(
    webhookUrl: string,
    intentData: {
      intentId: string;
      status: string;
      from: {
        chain: string;
        token: string;
        amount: string;
        formatted: string;
      };
      to: {
        chain: string;
        token: string;
        actualOutput: string;
        formatted: string;
      };
      txHash: string | null;
      executionTimeMs: number | null;
      metadata?: any;
    }
  ): Promise<boolean> {
    const event: WebhookEvent = {
      event: 'swap.completed',
      eventId: `evt_${crypto.randomBytes(16).toString('hex')}`,
      timestamp: new Date().toISOString(),
      data: intentData
    };

    return this.sendWebhook(webhookUrl, event);
  }

  /**
   * Send swap failed webhook
   */
  public async sendSwapFailedWebhook(
    webhookUrl: string,
    intentData: {
      intentId: string;
      status: string;
      errorMessage: string;
      from: {
        chain: string;
        token: string;
        amount: string;
      };
      to: {
        chain: string;
        token: string;
      };
    }
  ): Promise<boolean> {
    const event: WebhookEvent = {
      event: 'swap.failed',
      eventId: `evt_${crypto.randomBytes(16).toString('hex')}`,
      timestamp: new Date().toISOString(),
      data: intentData
    };

    return this.sendWebhook(webhookUrl, event);
  }

  /**
   * Send swap deposited webhook (when user sends tokens)
   */
  public async sendSwapDepositedWebhook(
    webhookUrl: string,
    intentData: {
      intentId: string;
      status: string;
      depositTxHash: string;
      from: {
        chain: string;
        token: string;
        amount: string;
      };
    }
  ): Promise<boolean> {
    const event: WebhookEvent = {
      event: 'swap.deposited',
      eventId: `evt_${crypto.randomBytes(16).toString('hex')}`,
      timestamp: new Date().toISOString(),
      data: intentData
    };

    return this.sendWebhook(webhookUrl, event);
  }
}

// Export singleton instance
export const webhookService = new WebhookService();
