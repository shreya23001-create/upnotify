import { NextResponse } from 'next/server'
import type { ZodSchema, ZodError } from 'zod'
import { logger } from '@/lib/utils/logger'

interface ValidationSuccess<T> {
  success: true
  data: T
}

interface ValidationFailure {
  success: false
  response: NextResponse
}

type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure

/**
 * Validates input against a Zod schema and returns either
 * the parsed data or a pre-built 400 NextResponse.
 *
 * Usage:
 *   const result = validateInput(schema, body)
 *   if (!result.success) return result.response
 *   // result.data is fully typed
 */
export function validateInput<T>(
  schema: ZodSchema<T>,
  data: unknown,
  context?: string
): ValidationResult<T> {
  const parsed = schema.safeParse(data)

  if (!parsed.success) {
    const flattened = (parsed.error as ZodError).flatten()
    logger.warn('Input validation failed', {
      context: context ?? 'api',
      errors: flattened.fieldErrors,
    })
    return {
      success: false,
      response: NextResponse.json(
        {
          error: 'Invalid input',
          details: flattened.fieldErrors,
        },
        { status: 400 }
      ),
    }
  }

  return { success: true, data: parsed.data }
}
