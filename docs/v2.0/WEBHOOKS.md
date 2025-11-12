# Webhooks Documentation

## Overview

AgentFi sends webhook notifications when swaps complete or fail. This allows you to receive real-time updates without polling the API.

**Status:** ✅ Implemented and tested

---

## Webhook Events

### swap.completed

Sent when a swap successfully completes.

**Payload:**
```json
{
  "event": "swap.completed",
  "eventId": "evt_1699564800123_abc123",
  "timestamp": "2025-11-12T10:30:00.000Z",
  "data": {
    "intentId": "550e8400-e29b-41d4-a716-446655440000",
    "status": "completed",
    "from": {
      "chain": "near",
      "token": "wNEAR",
      "amount": "2200000000000000000000000"
    },
    "to": {
      "chain": "near",
      "token": "USDC",
      "actualOutput": "5134218"
    },
    "txHash": "ABC123DEF456...",
    "completedAt": "2025-11-12T10:30:45.000Z"
  }
}
```

### swap.failed

Sent when a swap fails.

**Payload:**
```json
{
  "event": "swap.failed",
  "eventId": "evt_1699564800456_def456",
  "timestamp": "2025-11-12T10:35:00.000Z",
  "data": {
    "intentId": "550e8400-e29b-41d4-a716-446655440001",
    "status": "failed",
    "from": {
      "chain": "near",
      "token": "wNEAR",
      "amount": "1000000000000000000000000"
    },
    "to": {
      "chain": "near",
      "token": "USDC",
      "actualOutput": null
    },
    "txHash": null,
    "completedAt": null
  }
}
```

---

## Setting Up Webhooks

### 1. Provide Webhook URL in Swap Request
```bash
curl -X POST https://api.agentfi.io/v2/swap \
  -H "Content-Type: application/json" \
  -d '{
    "from": {
      "chain": "near",
      "token": "wNEAR",
      "amount": "2200000000000000000000000"
    },
    "to": {
      "chain": "near",
      "token": "USDC"
    },
    "user": {
      "walletAddress": "your-account.near"
    },
    "options": {
      "webhookUrl": "https://your-app.com/webhooks/agentfi"
    }
  }'
```

### 2. Implement Webhook Endpoint

Your webhook endpoint should:
- Accept POST requests
- Respond with 2xx status code
- Verify the webhook signature
- Process the payload

**Example (Node.js/Express):**
```typescript
import express from 'express';
import crypto from 'crypto';

const app = express();
app.use(express.json());

const WEBHOOK_SECRET = 'your-webhook-secret'; // From AgentFi

app.post('/webhooks/agentfi', (req, res) => {
  // 1. Verify signature
  const signature = req.headers['x-agentfi-signature'];
  const payload = req.body;
  
  if (!verifySignature(payload, signature, WEBHOOK_SECRET)) {
    return res.status(401).send('Invalid signature');
  }
  
  // 2. Process event
  const { event, data } = payload;
  
  if (event === 'swap.completed') {
    console.log(`Swap ${data.intentId} completed!`);
    console.log(`Output: ${data.to.actualOutput} ${data.to.token}`);
    console.log(`Tx: ${data.txHash}`);
    
    // Your business logic here
    // e.g., update database, notify user, etc.
  }
  
  if (event === 'swap.failed') {
    console.log(`Swap ${data.intentId} failed!`);
    // Handle failure
  }
  
  // 3. Respond quickly
  res.status(200).send('OK');
});

function verifySignature(payload, signature, secret) {
  // Remove 'sha256=' prefix if present
  const receivedSig = signature.replace('sha256=', '');
  
  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(receivedSig),
    Buffer.from(expectedSig)
  );
}

app.listen(3000);
```

---

## Security - Signature Verification

Every webhook includes an HMAC signature for verification.

### Headers
```
X-AgentFi-Signature: sha256=abc123def456...
X-AgentFi-Event: swap.completed
X-AgentFi-Event-ID: evt_1699564800123_abc123
```

### Verification Steps

1. Extract signature from `X-AgentFi-Signature` header
2. Remove `sha256=` prefix
3. Compute HMAC-SHA256 of the payload using your webhook secret
4. Compare signatures using constant-time comparison

**Python Example:**
```python
import hmac
import hashlib
import json

def verify_signature(payload, signature, secret):
    # Remove prefix
    received_sig = signature.replace('sha256=', '')
    
    # Compute expected signature
    payload_str = json.dumps(payload, separators=(',', ':'))
    expected_sig = hmac.new(
        secret.encode(),
        payload_str.encode(),
        hashlib.sha256
    ).hexdigest()
    
    # Constant-time comparison
    return hmac.compare_digest(received_sig, expected_sig)

# Usage
signature = request.headers.get('X-AgentFi-Signature')
payload = request.json

if verify_signature(payload, signature, WEBHOOK_SECRET):
    # Process webhook
    pass
else:
    # Invalid signature
    return 401
```

---

## Delivery Guarantees

### Retry Policy

- **Attempts:** Up to 3 retries
- **Delay:** 5 seconds between retries
- **Timeout:** 10 seconds per attempt

### Success Criteria

Webhook is considered successful if:
- HTTP status code is 2xx (200-299)
- Response received within 10 seconds

### Failure Handling

If all 3 attempts fail:
- Webhook marked as failed in logs
- No further retries
- User can check swap status via API

---

## Best Practices

### 1. Respond Quickly
```typescript
// ✅ GOOD: Respond immediately, process async
app.post('/webhook', async (req, res) => {
  res.status(200).send('OK');  // Respond first
  
  // Then process
  await processWebhook(req.body);
});

// ❌ BAD: Long processing before response
app.post('/webhook', async (req, res) => {
  await slowDatabaseOperation();  // 5 seconds
  await sendEmailNotification();  // 3 seconds
  res.status(200).send('OK');  // Timeout!
});
```

### 2. Handle Duplicates

Events may be delivered multiple times. Use `eventId` for idempotency:
```typescript
const processedEvents = new Set();

app.post('/webhook', (req, res) => {
  const { eventId, data } = req.body;
  
  // Check if already processed
  if (processedEvents.has(eventId)) {
    return res.status(200).send('Already processed');
  }
  
  // Process event
  handleSwapComplete(data);
  processedEvents.add(eventId);
  
  res.status(200).send('OK');
});
```

### 3. Log Everything
```typescript
app.post('/webhook', (req, res) => {
  const signature = req.headers['x-agentfi-signature'];
  const payload = req.body;
  
  // Log receipt
  console.log('Webhook received:', {
    event: payload.event,
    eventId: payload.eventId,
    intentId: payload.data.intentId
  });
  
  // Verify
  if (!verifySignature(payload, signature)) {
    console.error('Invalid signature:', {
      received: signature,
      payload: payload
    });
    return res.status(401).send('Invalid signature');
  }
  
  // Process
  try {
    handleWebhook(payload);
    console.log('Webhook processed successfully');
  } catch (error) {
    console.error('Webhook processing failed:', error);
  }
  
  res.status(200).send('OK');
});
```

### 4. Use HTTPS

Always use HTTPS endpoints for webhooks to ensure security:
```
✅ https://your-app.com/webhooks/agentfi
❌ http://your-app.com/webhooks/agentfi
```

---

## Testing Webhooks

### Local Testing with ngrok
```bash
# 1. Install ngrok
brew install ngrok  # or download from ngrok.com

# 2. Start your local server
node server.js  # Running on localhost:3000

# 3. Create tunnel
ngrok http 3000

# 4. Use ngrok URL in swap request
# https://abc123.ngrok.io/webhooks/agentfi
```

### Manual Testing

Create a test webhook endpoint:
```bash
# Using webhook.site (free service)
# 1. Go to https://webhook.site
# 2. Copy your unique URL
# 3. Use it in swap request

curl -X POST http://localhost:3000/v2/swap \
  -H "Content-Type: application/json" \
  -d '{
    "from": {"chain": "near", "token": "wNEAR", "amount": "2200000000000000000000000"},
    "to": {"chain": "near", "token": "USDC"},
    "user": {"walletAddress": "test.near"},
    "options": {
      "webhookUrl": "https://webhook.site/your-unique-id"
    }
  }'

# 4. Check webhook.site to see the payload
```

---

## Troubleshooting

### Webhooks Not Received

**Check:**
1. Webhook URL is accessible from internet
2. Endpoint responds with 2xx status code
3. Response time < 10 seconds
4. HTTPS (not HTTP)

### Invalid Signature Errors

**Check:**
1. Using correct webhook secret
2. Verifying entire payload (not modified)
3. Using constant-time comparison
4. No whitespace or encoding issues

### Delayed Webhooks

Webhooks sent when swap completes. Typical timing:
- Deposit detected: ~10 seconds
- Swap execution: ~10-30 seconds
- **Total: 20-60 seconds from deposit**

---

## FAQ

**Q: Can I use the same webhook URL for multiple swaps?**  
A: Yes. Each webhook includes the `intentId` to identify the swap.

**Q: What if my webhook endpoint is down?**  
A: AgentFi retries 3 times. After that, check swap status via API.

**Q: Can I change the webhook URL after creating the swap?**  
A: No. The webhook URL is set at swap creation and cannot be changed.

**Q: Do I need to verify signatures?**  
A: Yes! Always verify signatures to ensure webhooks are from AgentFi.

**Q: What if I receive duplicate webhooks?**  
A: Use the `eventId` for idempotency. Same `eventId` = same event.

---

## API Reference

### Request Format
```typescript
interface SwapRequest {
  from: { chain: string; token: string; amount: string };
  to: { chain: string; token: string };
  user: { walletAddress: string };
  options?: {
    webhookUrl?: string;  // Optional webhook URL
  };
}
```

### Webhook Payload
```typescript
interface WebhookPayload {
  event: 'swap.completed' | 'swap.failed';
  eventId: string;
  timestamp: string;  // ISO 8601
  data: {
    intentId: string;
    status: string;
    from: { chain: string; token: string; amount: string };
    to: { chain: string; token: string; actualOutput: string | null };
    txHash: string | null;
    completedAt: string | null;
  };
}
```

---

**Document Version:** 1.0.0  
**Last Updated:** November 12, 2025  
**Status:** ✅ Production Ready
