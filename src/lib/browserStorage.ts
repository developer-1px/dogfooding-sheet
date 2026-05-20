export interface KeyValueStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export const MAX_STORED_JSON_LENGTH = 5_000_000

export interface StoredJsonOptions {
  maxLength?: number
}

const storageLimit = (opts: StoredJsonOptions): number =>
  opts.maxLength === undefined || !Number.isFinite(opts.maxLength)
    ? MAX_STORED_JSON_LENGTH
    : Math.max(0, Math.floor(opts.maxLength))

export function getBrowserStorage(): KeyValueStorage | null {
  try {
    return globalThis.localStorage ?? null
  } catch {
    return null
  }
}

export function readStoredJson(
  key: string,
  storage: KeyValueStorage | null = getBrowserStorage(),
  opts: StoredJsonOptions = {},
): unknown | undefined {
  if (!storage) return undefined
  try {
    const raw = storage.getItem(key)
    if (raw !== null && raw.length > storageLimit(opts)) return undefined
    return raw === null ? undefined : JSON.parse(raw)
  } catch {
    return undefined
  }
}

export function writeStoredJson(
  key: string,
  value: unknown,
  storage: KeyValueStorage | null = getBrowserStorage(),
  opts: StoredJsonOptions = {},
): void {
  if (!storage) return
  try {
    const json = JSON.stringify(value)
    if (typeof json !== 'string') return
    if (json.length > storageLimit(opts)) return
    storage.setItem(key, json)
  } catch {
    // Storage can be unavailable or over quota; persistence must not break editing.
  }
}

export function removeStoredKey(key: string, storage: KeyValueStorage | null = getBrowserStorage()): void {
  if (!storage) return
  try {
    storage.removeItem(key)
  } catch {
    // Best-effort cleanup.
  }
}
