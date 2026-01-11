/**
 * Error handling utilities for API endpoints (T084)
 * Provides consistent error responses and error classification
 */

import { NextResponse } from 'next/server';
import { createLogger, Logger } from './logger';

// Error codes for client-side handling
export enum ErrorCode {
  // Authentication errors (401)
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',

  // Authorization errors (403)
  FORBIDDEN = 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',

  // Not found errors (404)
  NOT_FOUND = 'NOT_FOUND',
  PROJECT_NOT_FOUND = 'PROJECT_NOT_FOUND',
  SPEC_NOT_FOUND = 'SPEC_NOT_FOUND',
  USER_NOT_FOUND = 'USER_NOT_FOUND',

  // Validation errors (400)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  INVALID_UUID = 'INVALID_UUID',

  // Conflict errors (409)
  CONFLICT = 'CONFLICT',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  SYNC_CONFLICT = 'SYNC_CONFLICT',

  // Gone errors (410)
  EXPIRED = 'EXPIRED',
  ALREADY_USED = 'ALREADY_USED',

  // Rate limit errors (429)
  RATE_LIMITED = 'RATE_LIMITED',

  // Server errors (500)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
}

// HTTP status codes
const STATUS_CODES: Record<ErrorCode, number> = {
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.INVALID_TOKEN]: 401,
  [ErrorCode.TOKEN_EXPIRED]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.INSUFFICIENT_PERMISSIONS]: 403,
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.PROJECT_NOT_FOUND]: 404,
  [ErrorCode.SPEC_NOT_FOUND]: 404,
  [ErrorCode.USER_NOT_FOUND]: 404,
  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.INVALID_INPUT]: 400,
  [ErrorCode.INVALID_UUID]: 400,
  [ErrorCode.CONFLICT]: 409,
  [ErrorCode.ALREADY_EXISTS]: 409,
  [ErrorCode.SYNC_CONFLICT]: 409,
  [ErrorCode.EXPIRED]: 410,
  [ErrorCode.ALREADY_USED]: 410,
  [ErrorCode.RATE_LIMITED]: 429,
  [ErrorCode.INTERNAL_ERROR]: 500,
  [ErrorCode.DATABASE_ERROR]: 500,
  [ErrorCode.SERVICE_UNAVAILABLE]: 503,
};

/**
 * Application error with code and details
 */
export class AppError extends Error {
  code: ErrorCode;
  details?: Record<string, unknown>;

  constructor(
    code: ErrorCode,
    message: string,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.details = details;
  }

  get statusCode(): number {
    return STATUS_CODES[this.code];
  }
}

/**
 * Error response structure
 */
export interface ErrorResponse {
  error: string;
  code: ErrorCode;
  details?: Record<string, unknown>;
  requestId?: string;
}

/**
 * Create a NextResponse for an error
 */
export function errorResponse(
  error: AppError | Error | unknown,
  logger?: Logger,
  requestId?: string
): NextResponse<ErrorResponse> {
  // Handle AppError
  if (error instanceof AppError) {
    logger?.warn(`Request failed: ${error.message}`, {
      code: error.code,
      details: error.details,
    });

    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        details: error.details,
        requestId,
      },
      { status: error.statusCode }
    );
  }

  // Handle standard Error
  if (error instanceof Error) {
    logger?.error('Unexpected error', error);

    // Don't expose internal error details in production
    const message =
      process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred'
        : error.message;

    return NextResponse.json(
      {
        error: message,
        code: ErrorCode.INTERNAL_ERROR,
        requestId,
      },
      { status: 500 }
    );
  }

  // Handle unknown error type
  logger?.error('Unknown error type', error);

  return NextResponse.json(
    {
      error: 'An unexpected error occurred',
      code: ErrorCode.INTERNAL_ERROR,
      requestId,
    },
    { status: 500 }
  );
}

/**
 * Wrap an async handler with error handling
 */
export function withErrorHandling<T extends unknown[]>(
  source: string,
  handler: (logger: Logger, ...args: T) => Promise<NextResponse>
): (...args: T) => Promise<NextResponse> {
  const logger = createLogger(source);

  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(logger, ...args);
    } catch (error) {
      return errorResponse(error, logger);
    }
  };
}

/**
 * Helper functions to create common errors
 */
export const Errors = {
  unauthorized: (message = 'Authentication required') =>
    new AppError(ErrorCode.UNAUTHORIZED, message),

  forbidden: (message = 'Access denied') =>
    new AppError(ErrorCode.FORBIDDEN, message),

  notFound: (resource: string) =>
    new AppError(ErrorCode.NOT_FOUND, `${resource} not found`),

  projectNotFound: (id?: string) =>
    new AppError(
      ErrorCode.PROJECT_NOT_FOUND,
      id ? `Project not found: ${id}` : 'Project not found'
    ),

  specNotFound: (id?: string) =>
    new AppError(
      ErrorCode.SPEC_NOT_FOUND,
      id ? `Spec not found: ${id}` : 'Spec not found'
    ),

  validationError: (message: string, details?: Record<string, unknown>) =>
    new AppError(ErrorCode.VALIDATION_ERROR, message, details),

  invalidInput: (field: string, reason?: string) =>
    new AppError(
      ErrorCode.INVALID_INPUT,
      reason ? `Invalid ${field}: ${reason}` : `Invalid ${field}`
    ),

  conflict: (message: string) =>
    new AppError(ErrorCode.CONFLICT, message),

  alreadyExists: (resource: string) =>
    new AppError(ErrorCode.ALREADY_EXISTS, `${resource} already exists`),

  expired: (resource: string) =>
    new AppError(ErrorCode.EXPIRED, `${resource} has expired`),

  rateLimited: (retryAfter?: number) =>
    new AppError(ErrorCode.RATE_LIMITED, 'Too many requests', { retryAfter }),

  internal: (message = 'Internal server error') =>
    new AppError(ErrorCode.INTERNAL_ERROR, message),
};
