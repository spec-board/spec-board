/**
 * Validation utilities for API endpoints (T082)
 */

import { NextResponse } from 'next/server';
import { z, ZodError, ZodSchema } from 'zod';

/**
 * Result type for validation
 */
export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: NextResponse };

/**
 * Parse and validate request body with a zod schema
 * Returns validated data or a NextResponse error
 */
export async function validateBody<T>(
  request: Request,
  schema: ZodSchema<T>
): Promise<ValidationResult<T>> {
  try {
    const body = await request.json();
    const data = schema.parse(body);
    return { success: true, data };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        error: NextResponse.json(
          {
            error: 'Validation failed',
            details: formatZodErrors(error),
          },
          { status: 400 }
        ),
      };
    }

    // JSON parse error
    if (error instanceof SyntaxError) {
      return {
        success: false,
        error: NextResponse.json(
          { error: 'Invalid JSON in request body' },
          { status: 400 }
        ),
      };
    }

    // Unknown error
    return {
      success: false,
      error: NextResponse.json(
        { error: 'Failed to parse request body' },
        { status: 400 }
      ),
    };
  }
}

/**
 * Parse and validate query parameters with a zod schema
 */
export function validateQuery<T>(
  searchParams: URLSearchParams,
  schema: ZodSchema<T>
): ValidationResult<T> {
  try {
    // Convert URLSearchParams to object
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });

    const data = schema.parse(params);
    return { success: true, data };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        error: NextResponse.json(
          {
            error: 'Invalid query parameters',
            details: formatZodErrors(error),
          },
          { status: 400 }
        ),
      };
    }

    return {
      success: false,
      error: NextResponse.json(
        { error: 'Failed to parse query parameters' },
        { status: 400 }
      ),
    };
  }
}

/**
 * Validate path parameters (UUIDs, etc.)
 */
export function validateUuid(value: string, paramName: string = 'id'): ValidationResult<string> {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!uuidRegex.test(value)) {
    return {
      success: false,
      error: NextResponse.json(
        { error: `Invalid ${paramName}: must be a valid UUID` },
        { status: 400 }
      ),
    };
  }

  return { success: true, data: value };
}

/**
 * Format zod errors into a user-friendly structure
 */
function formatZodErrors(error: ZodError): Record<string, string[]> {
  const errors: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const path = issue.path.join('.') || '_root';
    if (!errors[path]) {
      errors[path] = [];
    }
    errors[path].push(issue.message);
  }

  return errors;
}
