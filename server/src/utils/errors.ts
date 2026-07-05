import { Request, Response, NextFunction } from 'express';
import logger from '../lib/logger';

export interface ErrorDetail {
  code: string;
  message: string;
}

export interface ErrorResponse {
  error: ErrorDetail;
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(message: string, statusCode: number = 400, code: string = 'BAD_REQUEST') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global Error Handler Middleware for Express.
 * Formats all errors into the shape: { error: { code, message } }
 */
export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction): void {
  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_SERVER_ERROR';
  const message = err.message || 'An unexpected error occurred.';

  // Log internal errors with full stack trace, client errors as info/warn
  if (statusCode === 500) {
    logger.error('Unhandled Server Error:', err);
  } else {
    logger.warn(`Client Error [${statusCode}] [${code}]: ${message}`);
  }

  res.status(statusCode).json({
    error: {
      code,
      message,
    },
  });
}
