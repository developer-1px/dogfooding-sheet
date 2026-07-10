import { readStoredJson, removeStoredKey, type KeyValueStorage } from './browserStorage'

/**
 * One-shot migration: read a legacy localStorage key into the SSOT doc and remove it.
 * Skips when SSOT slot is non-empty (idempotent re-run safe).
 *
 * @param isEmpty - true when the SSOT slot has no content (so legacy may be hydrated)
 * @param coerce  - parse + validate the raw JSON; return undefined to skip the load
 * @param load    - apply the validated value via ops (typically ops.replace at root path)
 */
export function migrateLegacyKey<Ops, V>(
  legacyKey: string,
  isEmpty: boolean,
  ops: Ops,
  coerce: (raw: unknown) => V | undefined,
  load: (ops: Ops, value: V) => void,
  storage?: KeyValueStorage | null,
): void {
  if (!isEmpty) return
  try {
    const raw = readStoredJson(legacyKey, storage)
    if (raw === undefined) return
    const value = coerce(raw)
    if (value !== undefined) load(ops, value)
    removeStoredKey(legacyKey, storage)
  } catch { /* ignore */ }
}
