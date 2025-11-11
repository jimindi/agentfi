// src/app.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { logger } from './utils/logger';
import { nearIntentsService } from './services/near-intents.service';
import { nearContractService } from './services/near-contract.service';

// Import v1 routes (old hybrid approach)
import swapRoutes from './routes/swap.routes';
import tokensRoutes from './routes/tokens.routes';
import authRoutes from './routes/auth.routes';

// Import v2 routes (new OneClick approach)
import v2Routes from './v2/routes/index';

export async function createApp() {
  const app = express();

  // Middleware
  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  // Request logging
  app.use((req, res, next) => {
    logger.info({ method: req.method, url: req.url }, 'Incoming request');
    next();
  });

  // Initialize services
  try {
    logger.info('Initializing services...');
    
    await nearIntentsService.init();
    logger.info('✅ NEAR Intents service initialized');
    
    await nearContractService.init();
    logger.info('✅ NEAR Contract service initialized');
    
  } catch (error) {
    logger.error({ error }, 'Failed to initialize services');
    throw error;
  }

  // Health check
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      services: {
        nearIntents: 'connected',
        nearContract: 'connected',
      },
    });
  });

  // API info endpoint
  app.get('/v1', (req, res) => {
    res.json({
      name: 'AgentFi Cross-Chain Swap API',
      version: '1.0.0',
      description: 'Hybrid approach using OneClick quotes + direct intents.near execution',
      deprecated: true,
      message: 'Please use /v2 endpoints',
      endpoints: {
        'POST /v1/swap': 'Execute cross-chain swap (deprecated)',
        'GET /v1/swap/:id': 'Get swap status (deprecated)',
        'POST /v1/swap/quote': 'Get swap quote (deprecated)',
        'GET /v1/tokens': 'List supported tokens',
        'POST /v1/auth/api-key': 'Create API key',
      },
    });
  });

  app.get('/v2', (req, res) => {
    res.json({
      name: 'AgentFi Cross-Chain Swap API v2',
      version: '2.0.0',
      description: 'Direct OneClick API integration',
      endpoints: {
        'POST /v2/swap': 'Execute cross-chain swap',
        'GET /v2/swap/:id': 'Get swap status',
      },
    });
  });

  // Mount v1 routes (deprecated)
  app.use('/v1/swap', swapRoutes);
  app.use('/v1/tokens', tokensRoutes);
  app.use('/v1/auth', authRoutes);

  // Mount v2 routes (current)
  app.use('/v2', v2Routes);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Endpoint not found',
        statusCode: 404,
      },
    });
  });

  // Error handler
  app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    logger.error({ err: error, req }, 'Unhandled error');
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
          statusCode: 500,
        },
      });
    }
  });

  return app;
}
