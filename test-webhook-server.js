const http = require('http');
const crypto = require('crypto');

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'your_webhook_secret_here_min_32_chars';

function verifySignature(payload, signature) {
  const expectedSignature = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');
  
  return signature === `sha256=${expectedSignature}`;
}

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/webhook') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      const signature = req.headers['x-agentfi-signature'];
      const event = req.headers['x-agentfi-event'];
      const eventId = req.headers['x-agentfi-event-id'];
      
      console.log('\n=== Webhook Received ===');
      console.log('Event:', event);
      console.log('Event ID:', eventId);
      console.log('Signature:', signature);
      
      // Verify signature
      const isValid = verifySignature(body, signature);
      console.log('Signature Valid:', isValid);
      
      if (isValid) {
        const payload = JSON.parse(body);
        console.log('Payload:', JSON.stringify(payload, null, 2));
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Webhook received' }));
      } else {
        console.log('❌ Invalid signature!');
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid signature' }));
      }
    });
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`\n🎣 Test webhook server listening on http://localhost:${PORT}/webhook`);
  console.log('Waiting for webhooks...\n');
});
