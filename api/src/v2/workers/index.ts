import { IntentMonitor } from './IntentMonitor';

const monitor = new IntentMonitor();

monitor.start();

process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down...');
  monitor.stop();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down...');
  monitor.stop();
  process.exit(0);
});

console.log('V2 Intent Monitor started');
