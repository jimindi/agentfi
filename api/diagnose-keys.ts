import { KeyPair, utils } from 'near-api-js';
import { config } from 'dotenv';
import * as crypto from 'crypto';

config();

async function diagnoseKeys() {
  console.log('=== NEAR Key Diagnostics ===\n');
  
  const accountId = process.env.NEAR_ACCOUNT_ID;
  const privateKeyStr = process.env.NEAR_PRIVATE_KEY;
  const publicKeyStr = process.env.NEAR_PUBLIC_KEY;
  
  console.log('1. Environment Variables:');
  console.log('   NEAR_ACCOUNT_ID:', accountId);
  console.log('   NEAR_PRIVATE_KEY:', privateKeyStr?.substring(0, 20) + '...');
  console.log('   NEAR_PUBLIC_KEY:', publicKeyStr);
  console.log();
  
  // Parse the keys
  console.log('2. Parse Private Key:');
  try {
    const keyPair = KeyPair.fromString(privateKeyStr!);
    console.log('   ✅ Private key parsed successfully');
    console.log('   Key type:', keyPair.constructor.name);
    
    const derivedPublicKey = keyPair.getPublicKey().toString();
    console.log('   Derived public key:', derivedPublicKey);
    console.log();
    
    console.log('3. Verify Keys Match:');
    if (derivedPublicKey === publicKeyStr) {
      console.log('   ✅ Public key matches private key');
    } else {
      console.log('   ❌ Public key MISMATCH!');
      console.log('   Expected:', publicKeyStr);
      console.log('   Got:', derivedPublicKey);
    }
    console.log();
    
    console.log('4. Test Signing:');
    const testMessage = 'test message';
    const messageBytes = Buffer.from(testMessage);
    const signature = keyPair.sign(messageBytes);
    console.log('   ✅ Successfully signed test message');
    console.log('   Signature:', signature.signature.toString('base64').substring(0, 20) + '...');
    console.log();
    
    console.log('5. Verify Signature:');
    const publicKey = keyPair.getPublicKey();
    const isValid = publicKey.verify(messageBytes, signature.signature);
    console.log('   Signature valid:', isValid ? '✅ YES' : '❌ NO');
    console.log();
    
    console.log('6. Account ID Format:');
    const isImplicitAccount = /^[0-9a-f]{64}$/.test(accountId!);
    console.log('   Account type:', isImplicitAccount ? 'Implicit (hash)' : 'Named');
    if (isImplicitAccount) {
      console.log('   ℹ️  Implicit accounts are derived from public keys');
      
      // Derive the implicit account ID from public key
      const publicKeyData = publicKey.data;
      const hash = crypto.createHash('sha256').update(publicKeyData).digest('hex');
      console.log('   Expected account ID:', hash);
      console.log('   Actual account ID:  ', accountId);
      console.log('   Match:', hash === accountId ? '✅ YES' : '❌ NO');
    }
    console.log();
    
    console.log('7. Credentials File:');
    const fs = await import('fs');
    const credPath = `${process.env.HOME}/.near-credentials/mainnet/${accountId}.json`;
    try {
      const credData = JSON.parse(fs.readFileSync(credPath, 'utf8'));
      console.log('   ✅ Credentials file exists');
      console.log('   account_id:', credData.account_id);
      console.log('   public_key:', credData.public_key);
      console.log('   Match:', credData.account_id === accountId && credData.public_key === publicKeyStr ? '✅ YES' : '❌ NO');
    } catch (e) {
      console.log('   ❌ Credentials file not found or invalid');
    }
    console.log();
    
    console.log('8. Key Access Verification:');
    // Check if account has the key registered on-chain
    const response = await fetch(`https://rpc.mainnet.near.org`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'dontcare',
        method: 'query',
        params: {
          request_type: 'view_access_key',
          finality: 'final',
          account_id: accountId,
          public_key: publicKeyStr
        }
      })
    });
    
    const data = await response.json();
    if (data.result) {
      console.log('   ✅ Key is registered on-chain');
      console.log('   Permission:', data.result.permission);
      console.log('   Nonce:', data.result.nonce);
    } else if (data.error) {
      console.log('   ❌ Key not found on-chain');
      console.log('   Error:', data.error.cause?.name || data.error.message);
    }
    
  } catch (error: any) {
    console.log('   ❌ Error:', error.message);
  }
  
  console.log('\n=== Diagnosis Complete ===');
}

diagnoseKeys().catch(console.error);
