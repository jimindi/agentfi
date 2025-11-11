import monitor from './IntentMonitor';

monitor.start();

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down worker...');
  monitor.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Shutting down worker...');
  monitor.stop();
  process.exit(0);
});
