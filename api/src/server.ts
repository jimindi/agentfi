import { createApp } from './app';
import { env } from './config/env';
import { logger } from './utils/logger';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function start() {
  try {
    // Test database connection
    await prisma.$connect();
    logger.info('✅ Database connected');

    // Create Express app (now async)
    const app = await createApp();
    
    // Start server
    const server = app.listen(Number(env.PORT), '0.0.0.0', () => {
      logger.info({
        port: env.PORT,
        environment: env.NODE_ENV,
        nearNetwork: env.NEAR_NETWORK,
        nearAccount: env.NEAR_ACCOUNT_ID
      }, '🚀 Server started successfully');
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info({ signal }, 'Shutting down gracefully...');
      
      server.close(async () => {
        await prisma.$disconnect();
        logger.info('Server closed');
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    logger.error({ error }, '❌ Failed to start server');
    process.exit(1);
  }
}

start();
