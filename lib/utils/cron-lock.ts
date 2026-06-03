import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'

/**
 * Row-with-expiry distributed lock for cron handlers.
 *
 * engineering-app#77 — when the previous cron tick hasn't finished, the
 * next one would otherwise start in parallel and race on shared resources
 * (the same monitors, the same DB connections, the same alert dispatch).
 * `acquireCronLock` returns false in that case so the new handler can
 * exit cleanly. `releaseCronLock` runs in the handler's `finally` block.
 *
 * Why not `pg_try_advisory_lock`?  PostgREST doesn't expose advisory locks
 * without a custom RPC wrapper, and we want zero infrastructure beyond a
 * regular table. The TTL guard makes a crashed cron self-healing —
 * after `ttlMs` the lock row counts as expired and the next caller can
 * claim it without manual intervention.
 *
 * Lock is released in three ways:
 *   1. The handler's `finally` block calls `releaseCronLock` on clean exit.
 *   2. The next acquirer atomically deletes any expired row before
 *      attempting its own insert (so a crashed previous run unblocks
 *      automatically after `ttlMs`).
 *   3. A periodic cleanup cron could prune expired rows; not required
 *      for correctness, only for a tidier table.
 */
export async function acquireCronLock(name: string, ttlMs: number): Promise<boolean> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any
  const now = new Date()
  const expiresAt = new Date(now.getTime() + ttlMs)

  // Step 1: prune any expired lock with this name. Idempotent — no-op
  // when nobody else has held the lock recently.
  const { error: pruneError } = await supabase
    .from('cron_locks')
    .delete()
    .eq('cron_name', name)
    .lte('expires_at', now.toISOString())
  if (pruneError) {
    logger.warn('cron-lock prune failed', { name, error: pruneError.message })
    // continue — the insert below will still tell us whether someone holds it
  }

  // Step 2: try to insert. Unique PK on cron_name means a still-live lock
  // makes this fail cleanly. 23505 is Postgres' unique-violation SQLSTATE.
  const { error: insertError } = await supabase
    .from('cron_locks')
    .insert({
      cron_name:  name,
      locked_at:  now.toISOString(),
      expires_at: expiresAt.toISOString(),
    })
  if (insertError) {
    if (insertError.code === '23505') return false // lock held
    logger.error('cron-lock acquire failed', { name, error: insertError.message })
    // Treat unknown errors as "lock held" — fail closed.
    return false
  }
  return true
}

export async function releaseCronLock(name: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any
  const { error } = await supabase.from('cron_locks').delete().eq('cron_name', name)
  if (error) {
    // Not fatal — the TTL will reclaim it eventually. Just log.
    logger.warn('cron-lock release failed (TTL will reclaim)', { name, error: error.message })
  }
}
