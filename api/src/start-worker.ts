// src/start-worker.ts
import { intentMonitorWorker } from './workers/intent-monitor.worker';
import { logger } from './utils/logger';

async function main() {
  try {
    logger.info('Starting Intent Monitor Worker...');
    
    await intentMonitorWorker.start();
    
    logger.info('✅ Intent Monitor Worker started successfully');
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      logger.info('Received SIGINT, shutting down gracefully...');
      intentMonitorWorker.stop();
      process.exit(0);
    });
    
    process.on('SIGTERM', () => {
      logger.info('Received SIGTERM, shutting down gracefully...');
      intentMonitorWorker.stop();
      process.exit(0);
    });
    
  } catch (error) {
    logger.error({ error }, 'Failed to start worker');
    process.exit(1);
  }
}

main();
