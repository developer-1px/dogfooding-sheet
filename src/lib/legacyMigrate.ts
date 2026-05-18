import type { JSONOps } from 'zod-crud'

/**
 * One-shot migration: read a legacy localStorage key into the SSOT doc and remove it.
 * Skips when SSOT slot is non-empty (idempotent re-run safe).
 *
 * @param isEmpty - true when the SSOT slot has no content (so legacy may be hydrated)
 * @param coerce  - parse + validate the raw JSON; return undefined to skip the load
 * @param load    - apply the validated value via ops (typically ops.replace at root path)
 */
export function migrateLegacyKey<T, V>(
  legacyKey: string,
  isEmpty: boolean,
  ops: JSONOps<T>,
  coerce: (raw: unknown) => V | undefined,
  load: (ops: JSONOps<T>, value: V) => void,
): void {
  if (!isEmpty) return
  try {
    const raw = localStorage.getItem(legacyKey)
    if (!raw) return
    const value = coerce(JSON.parse(raw))
    if (value !== undefined) load(ops, value)
    localStorage.removeItem(legacyKey)
  } catch { /* ignore */ }
}
