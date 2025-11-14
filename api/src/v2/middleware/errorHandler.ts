import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors';
import { logger } from '../../utils/logger';

/**
 * Global error handler middleware
 * Catches all errors and formats them consistently
 */
export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Default error values
  let statusCode = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'An unexpected error occurred';
  let details: any = undefined;

  // If it's our custom AppError
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
    details = err.details;

    // Log operational errors as warnings, non-operational as errors
    if (err.isOperational) {
      logger.warn(
        {
          code: err.code,
          statusCode: err.statusCode,
          message: err.message,
          details: err.details,
          path: req.path,
          method: req.method,
        },
        'Operational error occurred'
      );
    } else {
      logger.error(
        {
          err,
          code: err.code,
          statusCode: err.statusCode,
          message: err.message,
          details: err.details,
          path: req.path,
          method: req.method,
        },
        'Non-operational error occurred'
      );
    }
  } else {
    // Unexpected error (not our custom AppError)
    logger.error(
      {
        err,
        path: req.path,
        method: req.method,
      },
      'Unexpected error occurred'
    );

    // In production, don't expose internal error details
    if (process.env.NODE_ENV === 'production') {
      message = 'An unexpected error occurred';
    } else {
      message = err.message;
    }
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    },
  });
}

/**
 * Async handler wrapper
 * Catches async errors and passes them to error handler
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * 404 handler for unknown routes
 */
export function notFoundHandler(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
}
