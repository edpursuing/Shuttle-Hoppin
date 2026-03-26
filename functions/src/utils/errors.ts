/**
 * Structured Error Helpers
 *
 * Utilities for consistent error handling across Cloud Functions.
 * Callable function errors should use HttpsError with a structured `details.code`.
 */

// Error codes follow domain/action pattern matching CONVENTIONS.md
export const ErrorCodes = {
  // Auth errors
  AUTH_INVALID: 'auth/invalid',
  AUTH_EXPIRED: 'auth/expired',

  // Input errors
  INPUT_MISSING: 'input/missing',
  INPUT_INVALID: 'input/invalid',

  // Ride errors
  RIDE_FULL: 'ride/full',
  RIDE_NOT_FOUND: 'ride/not-found',
  RIDE_OVERLAP: 'ride/overlap',
  RIDE_ALREADY_BOOKED: 'ride/already-booked',
  RIDE_CANCELLED: 'ride/cancelled',

  // User errors
  USER_NOT_FOUND: 'user/not-found',
  USER_NO_CAR: 'user/no-car',
} as const;
