import express from 'express';

const app = express();
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/test', (req, res) => {
  res.json({ received: req.body });
});

app.listen(3000, () => {
  console.log('Test server running on port 3000');
});
