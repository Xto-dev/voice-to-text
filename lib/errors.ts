/**
 * Error handling and logging utilities
 */

import { NextResponse } from 'next/server'

/**
 * Standard API error response
 */
export interface ApiErrorResponse {
  error: string
  code?: string
  details?: Record<string, any>
}

/**
 * Custom application error
 */
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message)
    this.name = 'AppError'
  }
}

/**
 * Log error to console and optional external service
 */
export async function logError(
  error: unknown,
  context?: Record<string, any>
) {
  const timestamp = new Date().toISOString()
  const errorMessage = error instanceof Error ? error.message : String(error)
  const stack = error instanceof Error ? error.stack : undefined

  const logData = {
    timestamp,
    message: errorMessage,
    stack,
    context,
  }

  console.error('[ERROR]', logData)

  // TODO: Send to Sentry or external logging service
  // if (process.env.SENTRY_DSN) {
  //   Sentry.captureException(error, { extra: context })
  // }
}

/**
 * Create standard API error response
 */
export function createErrorResponse(
  message: string,
  statusCode: number = 500,
  code?: string,
  details?: Record<string, any>
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      error: message,
      code,
      details,
    },
    { status: statusCode }
  )
}

/**
 * Safely parse JSON with error handling
 */
export async function safeJsonParse<T>(
  text: string,
  fallback?: T
): Promise<T | null> {
  try {
    return JSON.parse(text) as T
  } catch (error) {
    logError(error, { context: 'JSON parse failed' })
    return fallback ?? null
  }
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      if (i < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, i)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError || new Error('Max retries exceeded')
}

/**
 * Validate required environment variables
 */
export function validateEnvVars(...vars: string[]): void {
  const missing = vars.filter((v) => !process.env[v])

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    )
  }
}

/**
 * Safe async wrapper for request handlers
 */
export function asyncHandler(
  fn: (...args: any[]) => Promise<any>
) {
  return async (...args: any[]) => {
    try {
      return await fn(...args)
    } catch (error) {
      logError(error)
      throw error
    }
  }
}
