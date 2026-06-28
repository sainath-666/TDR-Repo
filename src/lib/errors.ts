export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
    public fields?: Record<string, string>,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', fields?: Record<string, string>) {
    super(400, message, 'VALIDATION_ERROR', fields);
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(401, message, 'AUTHENTICATION_ERROR');
  }
}

export class AuthorizationError extends AppError {
  constructor(
    message = 'Not authorized',
    public action?: string,
    public resourceKind?: string,
  ) {
    super(403, message, 'AUTHORIZATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(404, `${resource} not found: ${id}`, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, message, 'CONFLICT');
  }
}

export class IntegrationError extends AppError {
  constructor(system: string, statusCode: number, message: string) {
    super(502, `${system} integration failed (${statusCode}): ${message}`, 'INTEGRATION_ERROR');
  }
}

export class FabricError extends AppError {
  constructor(operation: string, message: string) {
    super(502, `Fabric ${operation} failed: ${message}`, 'FABRIC_ERROR');
  }
}

import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { logger } from './logger';

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        code: error.code,
        ...(error.fields ? { fields: error.fields } : {}),
      },
      { status: error.statusCode },
    );
  }

  if (error instanceof ZodError) {
    const fields: Record<string, string> = {};
    for (const issue of error.issues) {
      const path = issue.path.join('.');
      fields[path] = issue.message;
    }
    return NextResponse.json(
      { success: false, error: 'Validation failed', code: 'VALIDATION_ERROR', fields },
      { status: 400 },
    );
  }

  logger.error('Unhandled error', {
    message: error instanceof Error ? error.message : 'Unknown error',
    ...(process.env.NODE_ENV !== 'production' && error instanceof Error
      ? { stack: error.stack }
      : {}),
  });

  return NextResponse.json(
    {
      success: false,
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : String(error),
      code: 'INTERNAL_ERROR',
    },
    { status: 500 },
  );
}

export function withErrorHandling<T extends unknown[]>(
  handler: (...args: T) => Promise<NextResponse>,
): (...args: T) => Promise<NextResponse> {
  return async (...args: T) => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleApiError(error);
    }
  };
}
