/** Map provider / Supabase errors to stable, user-safe copy. Never pass raw messages to the UI. */
export function friendlyAuthError(error: unknown, fallback = 'Sign-in failed. Please try again.'): string {
  const raw =
    (error && typeof error === 'object' && 'message' in error && typeof (error as { message: unknown }).message === 'string'
      ? (error as { message: string }).message
      : error instanceof Error
        ? error.message
        : '') || ''

  const lower = raw.toLowerCase()
  const code =
    error && typeof error === 'object' && 'code' in error && typeof (error as { code: unknown }).code === 'string'
      ? (error as { code: string }).code.toLowerCase()
      : ''

  if (
    code.includes('otp_expired') ||
    lower.includes('expired') ||
    lower.includes('otp_expired')
  ) {
    return 'This sign-in link has expired. Request a new one.'
  }
  if (
    code.includes('otp_disabled') ||
    lower.includes('already been used') ||
    lower.includes('invalid') && lower.includes('token')
  ) {
    return 'This sign-in link is invalid or has already been used. Request a new one.'
  }
  if (
    lower.includes('access_denied') ||
    lower.includes('user cancelled') ||
    lower.includes('user_cancelled') ||
    lower.includes('flow_state')
  ) {
    return 'Sign-in was cancelled. You can try again when ready.'
  }
  if (lower.includes('email rate limit') || lower.includes('over_email_send_rate_limit')) {
    return 'Too many sign-in emails were sent. Wait a minute and try again.'
  }
  if (lower.includes('network') || lower.includes('fetch')) {
    return 'Network error while signing in. Check your connection and try again.'
  }
  if (lower.includes('supabase is not configured') || lower.includes('missing vite_supabase')) {
    return 'Authentication is not configured for this environment.'
  }

  return fallback
}

/** Read OAuth / magic-link error params from the callback URL. */
export function authErrorFromUrl(url: URL): string | null {
  const error = url.searchParams.get('error')
  const description = url.searchParams.get('error_description')
  if (!error && !description) return null
  return friendlyAuthError(
    { message: description || error || '', code: error || '' },
    'Sign-in was cancelled or could not be completed.',
  )
}
