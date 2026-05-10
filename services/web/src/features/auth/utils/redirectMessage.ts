/**
 * Centralized auth redirect tokens and their user-facing messages.
 * Used by route handlers and UI components to display consistent feedback after OAuth/link flows.
 */

export const AUTH_REDIRECT_MESSAGES = {
  auth_failed: 'Authentication failed. Please try again.',
  callback_failed: 'Authentication failed. Please try again.',
  oauth_failed: 'Authentication failed. Please try again.',
  auth_conflict: 'Authentication failed. Please try again.',
  banned: 'Your account is banned.',
  session_invalid: 'Your session expired. Please sign in again.',
  invalid_credentials: 'Invalid email or password.',
  link_success: 'Account linked successfully.',
  link_failed: 'Linking failed. Please try again.',
  link_conflict: 'This account is already linked to another user.',
} as const;

export type AuthRedirectToken = keyof typeof AUTH_REDIRECT_MESSAGES;

export function isValidAuthRedirectToken(
  value: string | null,
): value is AuthRedirectToken {
  if (!value) return false;
  return value in AUTH_REDIRECT_MESSAGES;
}

export function getAuthRedirectMessage(
  token: string | null,
  isFallbackError = false,
): string | null {
  if (!token) return null;
  if (isValidAuthRedirectToken(token)) {
    return AUTH_REDIRECT_MESSAGES[token];
  }
  return isFallbackError ? 'Something went wrong. Please try again.' : null;
}