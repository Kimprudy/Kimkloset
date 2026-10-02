import { NextResponse } from 'next/server';

export function apiError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export const SIGN_IN_REQUIRED = 'Please sign in first.';

/** Mobile deep links we're allowed to send people back to (stops open redirects). */
export function isAllowedReturnUrl(url: unknown): url is string {
  return typeof url === 'string' && (url.startsWith('kimkloset://') || url.startsWith('exp://'));
}
