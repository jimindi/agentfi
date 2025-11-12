import crypto from 'crypto';

interface WebhookPayload {
  event: 'swap.completed' | 'swap.failed';
  eventId: string;
  timestamp: string;
  data: {
    intentId: string;
    status: string;
    from: {
      chain: string;
      token: string;
      amount: string;
    };
    to: {
      chain: string;
      token: string;
      actualOutput: string | null;
    };
    txHash: string | null;
    completedAt: string | null;
  };
}

export class WebhookService {
  private static readonly WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'dev-webhook-secret';
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY_MS = 5000; // 5 seconds

  /**
   * Send webhook notification
   */
  static async sendWebhook(url: string, payload: WebhookPayload): Promise<boolean> {
    // Generate signature
    const signature = this.generateSignature(payload);

    // Attempt delivery with retries
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-AgentFi-Signature': `sha256=${signature}`,
            'X-AgentFi-Event': payload.event,
            'X-AgentFi-Event-ID': payload.eventId,
            'User-Agent': 'AgentFi-Webhook/1.0'
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(10000) // 10 second timeout
        });

        if (response.ok) {
          console.log(`Webhook delivered successfully to ${url} (attempt ${attempt})`);
          return true;
        }

        console.warn(`Webhook delivery failed: ${response.status} (attempt ${attempt}/${this.MAX_RETRIES})`);

        // Wait before retry (except on last attempt)
        if (attempt < this.MAX_RETRIES) {
          await this.sleep(this.RETRY_DELAY_MS);
        }
      } catch (error) {
        console.error(`Webhook delivery error (attempt ${attempt}/${this.MAX_RETRIES}):`, error);

        // Wait before retry (except on last attempt)
        if (attempt < this.MAX_RETRIES) {
          await this.sleep(this.RETRY_DELAY_MS);
        }
      }
    }

    console.error(`Webhook delivery failed after ${this.MAX_RETRIES} attempts: ${url}`);
    return false;
  }

  /**
   * Generate HMAC signature for webhook payload
   */
  static generateSignature(payload: WebhookPayload): string {
    const payloadString = JSON.stringify(payload);
    return crypto
      .createHmac('sha256', this.WEBHOOK_SECRET)
      .update(payloadString)
      .digest('hex');
  }

  /**
   * Verify webhook signature (for client-side verification)
   */
  static verifySignature(payload: WebhookPayload, signature: string): boolean {
    const expectedSignature = this.generateSignature(payload);
    
    // Ensure both buffers are same length before comparison
    if (signature.length !== expectedSignature.length) {
      return false;
    }
    
    try {
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch (error) {
      return false;
    }
  }

  /**
   * Create webhook payload for swap completion
   */
  static createSwapCompletedPayload(intentData: any): WebhookPayload {
    return {
      event: 'swap.completed',
      eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      data: {
        intentId: intentData.id,
        status: intentData.status,
        from: {
          chain: intentData.fromChain,
          token: intentData.fromToken,
          amount: intentData.fromAmount
        },
        to: {
          chain: intentData.toChain,
          token: intentData.toToken,
          actualOutput: intentData.actualOutputAmount || null
        },
        txHash: intentData.txHash || null,
        completedAt: intentData.completedAt?.toISOString() || null
      }
    };
  }

  /**
   * Create webhook payload for swap failure
   */
  static createSwapFailedPayload(intentData: any): WebhookPayload {
    return {
      event: 'swap.failed',
      eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      data: {
        intentId: intentData.id,
        status: intentData.status,
        from: {
          chain: intentData.fromChain,
          token: intentData.fromToken,
          amount: intentData.fromAmount
        },
        to: {
          chain: intentData.toChain,
          token: intentData.toToken,
          actualOutput: null
        },
        txHash: null,
        completedAt: null
      }
    };
  }

  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
