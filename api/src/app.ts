import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { logger } from './utils/logger';
import { env } from './config/env';
import swapRoutes from './routes/swap.routes';
import tokensRoutes from './routes/tokens.routes';

export function createApp() {
  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));

  // Request ID middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    req.id = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    res.setHeader('X-Request-ID', req.id);
    next();
  });

  // Request logging
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      logger.info({
        requestId: req.id,
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration
      }, 'Request completed');
    });
    
    next();
  });

  // Health check endpoint
  app.get('/health', async (req: Request, res: Response) => {
    try {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: env.NODE_ENV,
        services: {
          database: 'connected',
          redis: 'connected',
          near: env.NEAR_NETWORK
        }
      });
    } catch (error) {
      logger.error({ error }, 'Health check failed');
      res.status(503).json({
        status: 'unhealthy',
        error: 'Service unavailable'
      });
    }
  });

  // API v1 routes
  app.get('/v1', (req: Request, res: Response) => {
    res.json({
      message: 'AgentFi API v1',
      documentation: 'https://docs.agentfi.io',
      version: '1.0.0',
      endpoints: {
        swap: 'POST /v1/swap',
        swapStatus: 'GET /v1/swap/:intentId',
        quote: 'POST /v1/quote',
        tokens: 'GET /v1/tokens',
        chains: 'GET /v1/chains'
      }
    });
  });

  // Mount routes
  app.use('/v1', swapRoutes);
  app.use('/v1', tokensRoutes);

  // 404 handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Endpoint not found',
        path: req.url
      }
    });
  });

  // Global error handler
  app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error({ 
      error,
      requestId: req.id,
      url: req.url,
      method: req.method
    }, 'Unhandled error');

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        requestId: req.id
      }
    });
  });

  return app;
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      id: string;
      apiKey?: any;
      user?: any;
    }
  }
}
