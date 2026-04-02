import { cookies } from 'next/headers'

const COOKIE_NAME = 'uptrue_impersonate'

/**
 * Check if an impersonation session is active (server-side).
 * Returns the impersonated user ID or null.
 */
export async function getImpersonatedUserId(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(COOKIE_NAME)?.value ?? null
}

/**
 * Returns true if the current request is an impersonation session.
 */
export async function isImpersonating(): Promise<boolean> {
  const id = await getImpersonatedUserId()
  return id !== null
}
