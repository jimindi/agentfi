import { describe, it, expect } from 'vitest';
import {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  RateLimitError,
  InternalError,
  ExternalServiceError,
  ServiceUnavailableError,
  TimeoutError,
} from '../errors';

describe('Error Classes', () => {
  describe('AppError', () => {
    it('should create base error with all properties', () => {
      const error = new AppError('Test error', 500, 'TEST_ERROR', true, { foo: 'bar' });
      
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('TEST_ERROR');
      expect(error.isOperational).toBe(true);
      expect(error.details).toEqual({ foo: 'bar' });
      expect(error.stack).toBeDefined();
    });

    it('should default isOperational to true', () => {
      const error = new AppError('Test', 400, 'TEST');
      expect(error.isOperational).toBe(true);
    });
  });

  describe('BadRequestError', () => {
    it('should create 400 error', () => {
      const error = new BadRequestError('Invalid input');
      
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('BAD_REQUEST');
      expect(error.message).toBe('Invalid input');
      expect(error.isOperational).toBe(true);
    });

    it('should include details', () => {
      const error = new BadRequestError('Invalid', { field: 'email' });
      expect(error.details).toEqual({ field: 'email' });
    });
  });

  describe('UnauthorizedError', () => {
    it('should create 401 error with default message', () => {
      const error = new UnauthorizedError();
      
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('UNAUTHORIZED');
      expect(error.message).toBe('Authentication required');
    });

    it('should accept custom message', () => {
      const error = new UnauthorizedError('Invalid API key');
      expect(error.message).toBe('Invalid API key');
    });
  });

  describe('ForbiddenError', () => {
    it('should create 403 error', () => {
      const error = new ForbiddenError();
      
      expect(error.statusCode).toBe(403);
      expect(error.code).toBe('FORBIDDEN');
      expect(error.message).toBe('Access forbidden');
    });
  });

  describe('NotFoundError', () => {
    it('should create 404 error with resource', () => {
      const error = new NotFoundError('User');
      
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
      expect(error.message).toBe('User not found');
    });

    it('should include identifier in message', () => {
      const error = new NotFoundError('User', '123');
      expect(error.message).toBe("User with ID '123' not found");
    });
  });

  describe('ConflictError', () => {
    it('should create 409 error', () => {
      const error = new ConflictError('Email already exists');
      
      expect(error.statusCode).toBe(409);
      expect(error.code).toBe('CONFLICT');
      expect(error.message).toBe('Email already exists');
    });
  });

  describe('ValidationError', () => {
    it('should create 422 error', () => {
      const error = new ValidationError('Validation failed', { field: 'amount' });
      
      expect(error.statusCode).toBe(422);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.message).toBe('Validation failed');
      expect(error.details).toEqual({ field: 'amount' });
    });
  });

  describe('RateLimitError', () => {
    it('should create 429 error with retry after', () => {
      const error = new RateLimitError('Too many requests', 3600);
      
      expect(error.statusCode).toBe(429);
      expect(error.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(error.message).toBe('Too many requests');
      expect(error.retryAfter).toBe(3600);
      expect(error.details).toEqual({ retryAfter: 3600 });
    });
  });

  describe('InternalError', () => {
    it('should create 500 error', () => {
      const error = new InternalError();
      
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('INTERNAL_ERROR');
      expect(error.message).toBe('Internal server error');
      expect(error.isOperational).toBe(false);
    });

    it('should accept custom message', () => {
      const error = new InternalError('Database error');
      expect(error.message).toBe('Database error');
    });
  });

  describe('ExternalServiceError', () => {
    it('should create 502 error with service name', () => {
      const error = new ExternalServiceError('OneClick API');
      
      expect(error.statusCode).toBe(502);
      expect(error.code).toBe('EXTERNAL_SERVICE_ERROR');
      expect(error.message).toBe('OneClick API is currently unavailable');
      expect(error.details).toEqual({ service: 'OneClick API' });
    });

    it('should include custom message', () => {
      const error = new ExternalServiceError('OneClick API', 'Connection timeout');
      expect(error.message).toBe('OneClick API error: Connection timeout');
    });
  });

  describe('ServiceUnavailableError', () => {
    it('should create 503 error', () => {
      const error = new ServiceUnavailableError();
      
      expect(error.statusCode).toBe(503);
      expect(error.code).toBe('SERVICE_UNAVAILABLE');
      expect(error.message).toBe('Service temporarily unavailable');
    });
  });

  describe('TimeoutError', () => {
    it('should create 504 error with service and timeout', () => {
      const error = new TimeoutError('OneClick API', 30000);
      
      expect(error.statusCode).toBe(504);
      expect(error.code).toBe('TIMEOUT_ERROR');
      expect(error.message).toBe('OneClick API request timed out after 30000ms');
      expect(error.details).toEqual({ service: 'OneClick API', timeout: 30000 });
    });
  });

  describe('Error Inheritance', () => {
    it('should maintain instanceof chain', () => {
      const error = new BadRequestError('Test');
      
      expect(error instanceof BadRequestError).toBe(true);
      expect(error instanceof AppError).toBe(true);
      expect(error instanceof Error).toBe(true);
    });

    it('should maintain stack trace', () => {
      const error = new NotFoundError('User', '123');
      
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain("User with ID");
    });
  });
});
