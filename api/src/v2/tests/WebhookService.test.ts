import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WebhookService } from '../services/WebhookService';

// Mock fetch
global.fetch = vi.fn();

describe('WebhookService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateSignature', () => {
    it('should generate consistent signatures for same payload', () => {
      const payload = {
        event: 'swap.completed' as const,
        eventId: 'evt_123',
        timestamp: '2025-11-12T00:00:00.000Z',
        data: {
          intentId: 'test-intent-id',
          status: 'completed',
          from: { chain: 'near', token: 'wNEAR', amount: '1000' },
          to: { chain: 'near', token: 'USDC', actualOutput: '2000' },
          txHash: 'tx123',
          completedAt: '2025-11-12T00:00:00.000Z'
        }
      };

      const sig1 = WebhookService.generateSignature(payload);
      const sig2 = WebhookService.generateSignature(payload);

      expect(sig1).toBe(sig2);
      expect(sig1).toHaveLength(64); // SHA256 hex = 64 chars
    });

    it('should generate different signatures for different payloads', () => {
      const payload1 = {
        event: 'swap.completed' as const,
        eventId: 'evt_123',
        timestamp: '2025-11-12T00:00:00.000Z',
        data: {
          intentId: 'intent-1',
          status: 'completed',
          from: { chain: 'near', token: 'wNEAR', amount: '1000' },
          to: { chain: 'near', token: 'USDC', actualOutput: '2000' },
          txHash: 'tx123',
          completedAt: '2025-11-12T00:00:00.000Z'
        }
      };

      const payload2 = {
        ...payload1,
        data: { ...payload1.data, intentId: 'intent-2' }
      };

      const sig1 = WebhookService.generateSignature(payload1);
      const sig2 = WebhookService.generateSignature(payload2);

      expect(sig1).not.toBe(sig2);
    });
  });

  describe('verifySignature', () => {
    it('should verify valid signature', () => {
      const payload = {
        event: 'swap.completed' as const,
        eventId: 'evt_123',
        timestamp: '2025-11-12T00:00:00.000Z',
        data: {
          intentId: 'test-intent-id',
          status: 'completed',
          from: { chain: 'near', token: 'wNEAR', amount: '1000' },
          to: { chain: 'near', token: 'USDC', actualOutput: '2000' },
          txHash: 'tx123',
          completedAt: '2025-11-12T00:00:00.000Z'
        }
      };

      const signature = WebhookService.generateSignature(payload);
      const isValid = WebhookService.verifySignature(payload, signature);

      expect(isValid).toBe(true);
    });

    it('should reject invalid signature', () => {
      const payload = {
        event: 'swap.completed' as const,
        eventId: 'evt_123',
        timestamp: '2025-11-12T00:00:00.000Z',
        data: {
          intentId: 'test-intent-id',
          status: 'completed',
          from: { chain: 'near', token: 'wNEAR', amount: '1000' },
          to: { chain: 'near', token: 'USDC', actualOutput: '2000' },
          txHash: 'tx123',
          completedAt: '2025-11-12T00:00:00.000Z'
        }
      };

      const isValid = WebhookService.verifySignature(payload, 'invalid-signature');

      expect(isValid).toBe(false);
    });
  });

  describe('createSwapCompletedPayload', () => {
    it('should create valid completed payload', () => {
      const intentData = {
        id: 'intent-123',
        status: 'completed',
        fromChain: 'near',
        fromToken: 'wNEAR',
        fromAmount: '1000000',
        toChain: 'near',
        toToken: 'USDC',
        actualOutputAmount: '2000000',
        txHash: 'tx-hash-123',
        completedAt: new Date('2025-11-12T00:00:00.000Z')
      };

      const payload = WebhookService.createSwapCompletedPayload(intentData);

      expect(payload.event).toBe('swap.completed');
      expect(payload.data.intentId).toBe('intent-123');
      expect(payload.data.status).toBe('completed');
      expect(payload.data.txHash).toBe('tx-hash-123');
      expect(payload.data.completedAt).toBe('2025-11-12T00:00:00.000Z');
    });
  });

  describe('createSwapFailedPayload', () => {
    it('should create valid failed payload', () => {
      const intentData = {
        id: 'intent-456',
        status: 'failed',
        fromChain: 'near',
        fromToken: 'wNEAR',
        fromAmount: '1000000',
        toChain: 'near',
        toToken: 'USDC'
      };

      const payload = WebhookService.createSwapFailedPayload(intentData);

      expect(payload.event).toBe('swap.failed');
      expect(payload.data.intentId).toBe('intent-456');
      expect(payload.data.status).toBe('failed');
      expect(payload.data.txHash).toBe(null);
      expect(payload.data.to.actualOutput).toBe(null);
    });
  });

  describe('sendWebhook', () => {
    it('should successfully send webhook on first attempt', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200
      } as Response);

      const payload = {
        event: 'swap.completed' as const,
        eventId: 'evt_123',
        timestamp: '2025-11-12T00:00:00.000Z',
        data: {
          intentId: 'test-intent-id',
          status: 'completed',
          from: { chain: 'near', token: 'wNEAR', amount: '1000' },
          to: { chain: 'near', token: 'USDC', actualOutput: '2000' },
          txHash: 'tx123',
          completedAt: '2025-11-12T00:00:00.000Z'
        }
      };

      const success = await WebhookService.sendWebhook('https://example.com/webhook', payload);

      expect(success).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      const mockFetch = vi.mocked(fetch);
      
      // First attempt fails
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      } as Response);
      
      // Second attempt succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200
      } as Response);

      const payload = {
        event: 'swap.completed' as const,
        eventId: 'evt_123',
        timestamp: '2025-11-12T00:00:00.000Z',
        data: {
          intentId: 'test-intent-id',
          status: 'completed',
          from: { chain: 'near', token: 'wNEAR', amount: '1000' },
          to: { chain: 'near', token: 'USDC', actualOutput: '2000' },
          txHash: 'tx123',
          completedAt: '2025-11-12T00:00:00.000Z'
        }
      };

      const success = await WebhookService.sendWebhook('https://example.com/webhook', payload);

      expect(success).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    }, 15000); // Increase timeout for retry delays

    it('should fail after max retries', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500
      } as Response);

      const payload = {
        event: 'swap.completed' as const,
        eventId: 'evt_123',
        timestamp: '2025-11-12T00:00:00.000Z',
        data: {
          intentId: 'test-intent-id',
          status: 'completed',
          from: { chain: 'near', token: 'wNEAR', amount: '1000' },
          to: { chain: 'near', token: 'USDC', actualOutput: '2000' },
          txHash: 'tx123',
          completedAt: '2025-11-12T00:00:00.000Z'
        }
      };

      const success = await WebhookService.sendWebhook('https://example.com/webhook', payload);

      expect(success).toBe(false);
      expect(mockFetch).toHaveBeenCalledTimes(3); // MAX_RETRIES
    }, 20000); // Increase timeout for retry delays
  });
});
