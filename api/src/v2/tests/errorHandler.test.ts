import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { errorHandler, asyncHandler, notFoundHandler } from '../middleware/errorHandler';
import {
  AppError,
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
  InternalError,
} from '../errors';

describe('Error Handler Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let jsonSpy: any;
  let statusSpy: any;

  beforeEach(() => {
    mockReq = {
      path: '/v2/test',
      method: 'POST',
    };

    jsonSpy = vi.fn();
    statusSpy = vi.fn().mockReturnValue({ json: jsonSpy });

    mockRes = {
      status: statusSpy,
      json: jsonSpy,
    };

    mockNext = vi.fn();
  });

  describe('errorHandler', () => {
    it('should handle AppError with all properties', () => {
      const error = new BadRequestError('Invalid input', { field: 'email' });

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: expect.objectContaining({
          code: 'BAD_REQUEST',
          message: 'Invalid input',
          details: { field: 'email' },
        }),
      });
    });

    it('should handle UnauthorizedError', () => {
      const error = new UnauthorizedError('Invalid API key');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(statusSpy).toHaveBeenCalledWith(401);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: expect.objectContaining({
          code: 'UNAUTHORIZED',
          message: 'Invalid API key',
        }),
      });
    });

    it('should handle NotFoundError', () => {
      const error = new NotFoundError('User', '123');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(statusSpy).toHaveBeenCalledWith(404);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: expect.objectContaining({
          code: 'NOT_FOUND',
          message: "User with ID '123' not found",
        }),
      });
    });

    it('should handle generic Error in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error = new Error('Something went wrong');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(statusSpy).toHaveBeenCalledWith(500);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: expect.objectContaining({
          code: 'INTERNAL_ERROR',
          message: 'Something went wrong',
          stack: expect.any(String),
        }),
      });

      process.env.NODE_ENV = originalEnv;
    });

    it('should hide error details in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const error = new Error('Database connection failed');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(statusSpy).toHaveBeenCalledWith(500);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: expect.objectContaining({
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        }),
      });

      // Should not include stack in production
      const errorResponse = jsonSpy.mock.calls[0][0].error;
      expect(errorResponse.stack).toBeUndefined();

      process.env.NODE_ENV = originalEnv;
    });

    it('should not include details when undefined', () => {
      const error = new UnauthorizedError('No details');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      const errorResponse = jsonSpy.mock.calls[0][0].error;
      expect(errorResponse.details).toBeUndefined();
    });

    it('should handle InternalError as non-operational', () => {
      const error = new InternalError('Critical error');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(statusSpy).toHaveBeenCalledWith(500);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: expect.objectContaining({
          code: 'INTERNAL_ERROR',
          message: 'Critical error',
        }),
      });
    });
  });

  describe('asyncHandler', () => {
    it('should handle successful async function', async () => {
      const asyncFn = async (req: Request, res: Response) => {
        res.json({ success: true });
      };

      const handler = asyncHandler(asyncFn);
      await handler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should catch async errors and pass to next', async () => {
      const error = new BadRequestError('Async error');
      const asyncFn = async (req: Request, res: Response) => {
        throw error;
      };

      const handler = asyncHandler(asyncFn);
      await handler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should handle thrown errors', async () => {
      const error = new Error('Thrown error');
      const asyncFn = async (req: Request, res: Response) => {
        throw error;
      };

      const handler = asyncHandler(asyncFn);
      await handler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('notFoundHandler', () => {
    it('should return 404 for unknown routes', () => {
      mockReq = {
        method: 'GET',
        path: '/v2/unknown/route',
      };

      notFoundHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(statusSpy).toHaveBeenCalledWith(404);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Route GET /v2/unknown/route not found',
        },
      });
    });

    it('should handle different HTTP methods', () => {
      mockReq = {
        method: 'POST',
        path: '/v2/invalid',
      };

      notFoundHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Route POST /v2/invalid not found',
        },
      });
    });
  });
});
