export const AUTH_ERRORS = {
  "not-configured": "Sign-in is not configured on this server.",
  failed: "We couldn't sign you in. Please try again.",
  denied: "Sign-in was cancelled. You can try again whenever you like.",
  "rate-limited": "Too many attempts. Please wait a minute and try again.",
} as const;

export type AuthErrorCode = keyof typeof AUTH_ERRORS;

export function parseAuthError(
  value: string | null | undefined,
): AuthErrorCode | null {
  return value !== null &&
    value !== undefined &&
    Object.hasOwn(AUTH_ERRORS, value)
    ? (value as AuthErrorCode)
    : null;
}
