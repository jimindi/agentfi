# AgentFi SDK - Integration Guide

**Version:** 1.0.0  
**Last Updated:** November 7, 2025

---

## Quick Start (10 Minutes)

This guide walks you through integrating AgentFi SDK into your application.

---

## Prerequisites

- Node.js 18+ or Python 3.8+
- NEAR mainnet account with tokens
- Basic understanding of REST APIs

---

## Step 1: Get API Key

Currently, API keys are not required, but will be mandatory soon.

To prepare for production:

    curl -X POST https://api.agentfi.io/v1/auth/api-key \
      -H "Content-Type: application/json" \
      -d '{
        "email": "your-email@example.com",
        "name": "My Trading Bot"
      }'

Response:

    {
      "success": true,
      "data": {
        "apiKey": "YOUR_API_KEY_HERE...",
        "name": "My Trading Bot"
      },
      "warning": "Store this key securely. It will not be shown again."
    }

Save this API key in your environment variables:

    AGENTFI_API_KEY=YOUR_API_KEY_HERE...

---

## Step 2: Install Dependencies

### TypeScript/JavaScript

    npm install near-api-js bs58

### Python

    pip install near-api-py base58

---

## Step 3: Sign NEP-413 Intent

Before calling the API, you must create and sign a NEP-413 intent with your NEAR private key.

### TypeScript/JavaScript

    import { KeyPair } from 'near-api-js';
    import bs58 from 'bs58';
    import { randomBytes } from 'crypto';

    function signNEP413Intent(accountId, privateKey, fromToken, fromAmount, toToken) {
      // Create intent message
      const intentMessage = {
        signer_id: accountId,
        deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        intents: [{
          intent: "token_diff",
          diff: {
            [fromToken]: `-${fromAmount}`,
            [toToken]: "1"
          }
        }]
      };

      // Sign with NEP-413
      const keyPair = KeyPair.fromString(privateKey);
      const nonce = randomBytes(32);
      
      const payload = {
        message: JSON.stringify(intentMessage),
        nonce: Buffer.from(nonce).toString('base64'),
        recipient: "intents.near"
      };

      const signatureData = Buffer.from(JSON.stringify(payload));
      const signature = keyPair.sign(signatureData);

      return {
        standard: "nep413",
        payload: payload,
        signature: "ed25519:" + bs58.encode(signature.signature),
        public_key: "ed25519:" + bs58.encode(keyPair.getPublicKey().data)
      };
    }

    // Usage
    const signedIntent = signNEP413Intent(
      "your-account.near",
      "ed25519:your-private-key",
      "nep141:wrap.near",
      "10000000000000000000000",
      "nep141:17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1"
    );

### Python

    import json
    import base64
    import hashlib
    from datetime import datetime, timedelta
    from near_api_py import Account, KeyPair
    import base58

    def sign_nep413_intent(account_id, private_key, from_token, from_amount, to_token):
        # Create intent message
        intent_message = {
            "signer_id": account_id,
            "deadline": (datetime.now() + timedelta(days=1)).isoformat() + "Z",
            "intents": [{
                "intent": "token_diff",
                "diff": {
                    from_token: f"-{from_amount}",
                    to_token: "1"
                }
            }]
        }

        # Sign with NEP-413
        key_pair = KeyPair(private_key)
        nonce = base64.b64encode(hashlib.sha256(str(datetime.now()).encode()).digest()[:32]).decode()
        
        payload = {
            "message": json.dumps(intent_message),
            "nonce": nonce,
            "recipient": "intents.near"
        }

        signature_data = json.dumps(payload).encode()
        signature = key_pair.sign(signature_data)

        return {
            "standard": "nep413",
            "payload": payload,
            "signature": f"ed25519:{base58.b58encode(signature).decode()}",
            "public_key": f"ed25519:{base58.b58encode(key_pair.public_key).decode()}"
        }

---

## Step 4: Execute Swap

### TypeScript/JavaScript

    async function executeSwap() {
      const signedIntent = signNEP413Intent(...);

      const response = await fetch('https://api.agentfi.io/v1/swap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.AGENTFI_API_KEY}`
        },
        body: JSON.stringify({
          from: {
            chain: 'near',
            token: 'wNEAR',
            amount: '10000000000000000000000'
          },
          to: {
            chain: 'near',
            token: 'USDC'
          },
          user: {
            walletAddress: 'your-account.near'
          },
          signedIntent: signedIntent
        })
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error.message);
      }

      return data.data;
    }

    // Execute
    const swap = await executeSwap();
    console.log('Intent ID:', swap.intentId);
    console.log('Deposit to:', swap.quote.depositAddress);

### Python

    import requests

    def execute_swap(signed_intent):
        response = requests.post(
            'https://api.agentfi.io/v1/swap',
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {os.getenv("AGENTFI_API_KEY")}'
            },
            json={
                'from': {
                    'chain': 'near',
                    'token': 'wNEAR',
                    'amount': '10000000000000000000000'
                },
                'to': {
                    'chain': 'near',
                    'token': 'USDC'
                },
                'user': {
                    'walletAddress': 'your-account.near'
                },
                'signedIntent': signed_intent
            }
        )
        
        data = response.json()
        
        if not data['success']:
            raise Exception(data['error']['message'])
        
        return data['data']

    # Execute
    signed_intent = sign_nep413_intent(...)
    swap = execute_swap(signed_intent)
    print(f"Intent ID: {swap['intentId']}")
    print(f"Deposit to: {swap['quote']['depositAddress']}")

---

## Step 5: Deposit Tokens

After getting the deposit address, you must deposit tokens to it.

### Using NEAR CLI

    near call wrap.near ft_transfer_call \
      '{"receiver_id":"intents.near","amount":"10000000000000000000000","msg":"{\"receiver_id\":\"DEPOSIT_ADDRESS\"}"}' \
      --accountId your-account.near \
      --networkId mainnet \
      --depositYocto 1 \
      --gas 300000000000000

### Programmatically (TypeScript)

    import { connect, keyStores, KeyPair } from 'near-api-js';

    async function depositTokens(depositAddress, amount) {
      const keyStore = new keyStores.InMemoryKeyStore();
      const keyPair = KeyPair.fromString(process.env.NEAR_PRIVATE_KEY);
      await keyStore.setKey('mainnet', process.env.NEAR_ACCOUNT_ID, keyPair);

      const near = await connect({
        networkId: 'mainnet',
        keyStore,
        nodeUrl: 'https://rpc.mainnet.near.org'
      });

      const account = await near.account(process.env.NEAR_ACCOUNT_ID);

      const result = await account.functionCall({
        contractId: 'wrap.near',
        methodName: 'ft_transfer_call',
        args: {
          receiver_id: 'intents.near',
          amount: amount,
          msg: JSON.stringify({ receiver_id: depositAddress })
        },
        gas: '300000000000000',
        attachedDeposit: '1'
      });

      console.log('Deposit transaction:', result.transaction.hash);
      return result.transaction.hash;
    }

    // Execute
    await depositTokens(swap.quote.depositAddress, '10000000000000000000000');

---

## Step 6: Monitor Status

Poll the status endpoint until the swap completes.

### TypeScript/JavaScript

    async function waitForCompletion(intentId, maxWaitSeconds = 120) {
      const startTime = Date.now();
      
      while (Date.now() - startTime < maxWaitSeconds * 1000) {
        const response = await fetch(
          `https://api.agentfi.io/v1/swap/${intentId}`
        );
        const { data } = await response.json();
        
        console.log(`Status: ${data.status}`);
        
        if (data.status === 'completed') {
          console.log('Swap completed!');
          console.log('Transaction:', data.txHash);
          console.log('Output:', data.to.actualOutput);
          return data;
        } else if (data.status === 'failed') {
          throw new Error('Swap failed');
        }
        
        // Wait 5 seconds before next poll
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
      
      throw new Error('Swap timeout');
    }

    // Execute
    const result = await waitForCompletion(swap.intentId);

### Python

    import time

    def wait_for_completion(intent_id, max_wait_seconds=120):
        start_time = time.time()
        
        while time.time() - start_time < max_wait_seconds:
            response = requests.get(
                f'https://api.agentfi.io/v1/swap/{intent_id}'
            )
            data = response.json()['data']
            
            print(f"Status: {data['status']}")
            
            if data['status'] == 'completed':
                print('Swap completed!')
                print(f"Transaction: {data['txHash']}")
                print(f"Output: {data['to']['actualOutput']}")
                return data
            elif data['status'] == 'failed':
                raise Exception('Swap failed')
            
            # Wait 5 seconds before next poll
            time.sleep(5)
        
        raise Exception('Swap timeout')

    # Execute
    result = wait_for_completion(swap['intentId'])

---

## Complete Example

### TypeScript/JavaScript

    import { KeyPair, connect, keyStores } from 'near-api-js';
    import bs58 from 'bs58';
    import { randomBytes } from 'crypto';

    class AgentFiClient {
      constructor(apiKey, accountId, privateKey) {
        this.apiKey = apiKey;
        this.accountId = accountId;
        this.keyPair = KeyPair.fromString(privateKey);
        this.baseUrl = 'https://api.agentfi.io/v1';
      }

      signIntent(fromToken, fromAmount, toToken) {
        const intentMessage = {
          signer_id: this.accountId,
          deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          intents: [{
            intent: "token_diff",
            diff: {
              [fromToken]: `-${fromAmount}`,
              [toToken]: "1"
            }
          }]
        };

        const nonce = randomBytes(32);
        const payload = {
          message: JSON.stringify(intentMessage),
          nonce: Buffer.from(nonce).toString('base64'),
          recipient: "intents.near"
        };

        const signatureData = Buffer.from(JSON.stringify(payload));
        const signature = this.keyPair.sign(signatureData);

        return {
          standard: "nep413",
          payload,
          signature: "ed25519:" + bs58.encode(signature.signature),
          public_key: "ed25519:" + bs58.encode(this.keyPair.getPublicKey().data)
        };
      }

      async executeSwap(fromToken, fromAmount, toToken) {
        const signedIntent = this.signIntent(fromToken, fromAmount, toToken);

        const response = await fetch(`${this.baseUrl}/swap`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          body: JSON.stringify({
            from: { chain: 'near', token: 'wNEAR', amount: fromAmount },
            to: { chain: 'near', token: 'USDC' },
            user: { walletAddress: this.accountId },
            signedIntent
          })
        });

        const data = await response.json();
        if (!data.success) throw new Error(data.error.message);
        return data.data;
      }

      async depositTokens(depositAddress, amount) {
        const keyStore = new keyStores.InMemoryKeyStore();
        await keyStore.setKey('mainnet', this.accountId, this.keyPair);

        const near = await connect({
          networkId: 'mainnet',
          keyStore,
          nodeUrl: 'https://rpc.mainnet.near.org'
        });

        const account = await near.account(this.accountId);

        await account.functionCall({
          contractId: 'wrap.near',
          methodName: 'ft_transfer_call',
          args: {
            receiver_id: 'intents.near',
            amount: amount,
            msg: JSON.stringify({ receiver_id: depositAddress })
          },
          gas: '300000000000000',
          attachedDeposit: '1'
        });
      }

      async waitForCompletion(intentId, maxWaitSeconds = 120) {
        const startTime = Date.now();
        
        while (Date.now() - startTime < maxWaitSeconds * 1000) {
          const response = await fetch(`${this.baseUrl}/swap/${intentId}`);
          const { data } = await response.json();
          
          if (data.status === 'completed') return data;
          if (data.status === 'failed') throw new Error('Swap failed');
          
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
        
        throw new Error('Swap timeout');
      }

      async swap(fromToken, fromAmount, toToken) {
        // 1. Execute swap
        const swap = await this.executeSwap(fromToken, fromAmount, toToken);
        console.log('Swap created:', swap.intentId);
        console.log('Deposit to:', swap.quote.depositAddress);

        // 2. Deposit tokens
        await this.depositTokens(swap.quote.depositAddress, fromAmount);
        console.log('Tokens deposited');

        // 3. Wait for completion
        const result = await this.waitForCompletion(swap.intentId);
        console.log('Swap completed!');
        
        return result;
      }
    }

    // Usage
    const client = new AgentFiClient(
      process.env.AGENTFI_API_KEY,
      'your-account.near',
      process.env.NEAR_PRIVATE_KEY
    );

    const result = await client.swap(
      'nep141:wrap.near',
      '10000000000000000000000',
      'nep141:17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1'
    );

    console.log('Final output:', result.to.actualOutput);

---

## Token Asset IDs

Always use the exact asset IDs for tokens:

| Token | Asset ID |
|-------|----------|
| wNEAR | nep141:wrap.near |
| USDC | nep141:17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1 |
| USDT | nep141:usdt.tether-token.near |

Get full list:

    curl https://api.agentfi.io/v1/tokens

---

## Error Handling

Always wrap API calls in try-catch blocks:

    try {
      const swap = await client.executeSwap(...);
    } catch (error) {
      if (error.response?.status === 400) {
        console.error('Invalid parameters:', error.response.data);
      } else if (error.response?.status === 429) {
        console.error('Rate limit exceeded, wait and retry');
      } else {
        console.error('Unexpected error:', error);
      }
    }

---

## Testing

Always test with small amounts first:

    // Good: Test with 0.01 wNEAR
    const amount = '10000000000000000000000';

    // Bad: Test with 100 wNEAR
    const amount = '100000000000000000000000000';

Monitor transactions on NEAR explorer:

    https://nearblocks.io/txns/{txHash}

---

## Production Checklist

- [ ] Store API keys in environment variables
- [ ] Store private keys securely (never commit to Git)
- [ ] Implement error retry logic
- [ ] Add logging for all swap operations
- [ ] Monitor swap success rates
- [ ] Set up alerts for failed swaps
- [ ] Test with small amounts first
- [ ] Implement rate limiting on your side
- [ ] Add webhook handlers (when available)

---

## Support

- **Documentation:** https://docs.agentfi.io
- **Email:** support@agentfi.io
- **Discord:** https://discord.gg/agentfi

---

**Last Updated:** November 7, 2025  
**Version:** 1.0.0
