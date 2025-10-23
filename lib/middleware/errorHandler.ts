import { NextResponse, NextRequest } from 'next/server';
import { ApiResponse } from '../types';
import { ProviderError } from '../providers/base';
import { AuthError } from './auth';

type RouteHandler = (request: NextRequest, context?: any) => Promise<Response | NextResponse>;

/**
 * Error codes for API responses
 */
export enum ErrorCode {
  // Authentication errors (401)
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_TOKEN = 'INVALID_TOKEN',

  // Authorization errors (403)
  FORBIDDEN = 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',

  // Client errors (400)
  BAD_REQUEST = 'BAD_REQUEST',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_PARAMETER = 'MISSING_PARAMETER',

  // Not found errors (404)
  NOT_FOUND = 'NOT_FOUND',
  MODEL_NOT_FOUND = 'MODEL_NOT_FOUND',
  USER_NOT_FOUND = 'USER_NOT_FOUND',

  // Rate limiting (429)
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // Server errors (500)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  PROVIDER_ERROR = 'PROVIDER_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',

  // Service errors (503)
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  MODEL_LOADING = 'MODEL_LOADING',
}

/**
 * API Error class
 */
export class APIError extends Error {
  constructor(
    message: string,
    public code: ErrorCode,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

/**
 * Format error response
 */
export function formatErrorResponse(
  error: Error,
  includeStack = process.env.NODE_ENV === 'development'
): ApiResponse {
  // Handle known error types
  if (error instanceof APIError) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    };
  }

  if (error instanceof AuthError) {
    return {
      success: false,
      error: {
        code: error.statusCode === 403 ? ErrorCode.FORBIDDEN : ErrorCode.UNAUTHORIZED,
        message: error.message,
      },
    };
  }

  if (error instanceof ProviderError) {
    return {
      success: false,
      error: {
        code: ErrorCode.PROVIDER_ERROR,
        message: error.message,
        details: {
          provider: error.provider,
          statusCode: error.statusCode,
          ...(error.details || {}),
        },
      },
    };
  }

  // Generic error
  return {
    success: false,
    error: {
      code: ErrorCode.INTERNAL_ERROR,
      message: includeStack ? error.message : 'An unexpected error occurred',
      details: includeStack
        ? {
            stack: error.stack,
            name: error.name,
          }
        : undefined,
    },
  };
}

/**
 * Get HTTP status code from error
 */
export function getStatusCode(error: Error): number {
  if (error instanceof APIError) {
    return error.statusCode;
  }

  if (error instanceof AuthError) {
    return error.statusCode;
  }

  if (error instanceof ProviderError) {
    return error.statusCode || 500;
  }

  // Default to 500
  return 500;
}

/**
 * Handle API error and return NextResponse
 */
export function handleAPIError(error: Error): NextResponse {
  const statusCode = getStatusCode(error);
  const response = formatErrorResponse(error);

  // Log error
  logError(error, { statusCode });

  return NextResponse.json(response, { status: statusCode });
}

/**
 * Log error to console (replace with proper logging service in production)
 */
export function logError(error: Error, context?: Record<string, any>) {
  const timestamp = new Date().toISOString();

  console.error('='.repeat(80));
  console.error(`[ERROR] ${timestamp}`);
  console.error('='.repeat(80));
  console.error('Message:', error.message);
  console.error('Name:', error.name);

  if (context) {
    console.error('Context:', JSON.stringify(context, null, 2));
  }

  if (error.stack) {
    console.error('Stack:', error.stack);
  }

  if (error instanceof APIError && error.details) {
    console.error('Details:', JSON.stringify(error.details, null, 2));
  }

  if (error instanceof ProviderError) {
    console.error('Provider:', error.provider);
    console.error('Status Code:', error.statusCode);
    if (error.details) {
      console.error('Provider Details:', JSON.stringify(error.details, null, 2));
    }
  }

  console.error('='.repeat(80));
}

/**
 * Validation error helper
 */
export function createValidationError(message: string, details?: any): APIError {
  return new APIError(message, ErrorCode.INVALID_INPUT, 400, details);
}

/**
 * Not found error helper
 */
export function createNotFoundError(resource: string, id?: string): APIError {
  const message = id
    ? `${resource} not found: ${id}`
    : `${resource} not found`;

  return new APIError(
    message,
    ErrorCode.NOT_FOUND,
    404,
    { resource, id }
  );
}

/**
 * Rate limit error helper
 */
export function createRateLimitError(resetAt?: Date): APIError {
  return new APIError(
    'Rate limit exceeded. Please try again later.',
    ErrorCode.RATE_LIMIT_EXCEEDED,
    429,
    { resetAt: resetAt?.toISOString() }
  );
}

/**
 * Validate request body
 */
export function validateRequest<T>(
  body: any,
  requiredFields: (keyof T)[]
): T {
  const missing: string[] = [];

  for (const field of requiredFields) {
    if (body[field] === undefined || body[field] === null) {
      missing.push(field as string);
    }
  }

  if (missing.length > 0) {
    throw createValidationError(
      `Missing required fields: ${missing.join(', ')}`,
      { missingFields: missing }
    );
  }

  return body as T;
}

/**
 * Async error wrapper for API routes
 */
export function withErrorHandling(handler: RouteHandler) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    try {
      const response = await handler(request, context);
      if (response instanceof NextResponse) {
        return response;
      }
      // Convert Response to NextResponse
      const { status, headers } = response;
      const body = response.body ? await response.text() : null;
      return new NextResponse(body, { status, headers });
    } catch (error: any) {
      return handleAPIError(error);
    }
  };
}
