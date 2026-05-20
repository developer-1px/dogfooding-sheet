export interface KeyValueStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export function getBrowserStorage(): KeyValueStorage | null {
  try {
    return globalThis.localStorage ?? null
  } catch {
    return null
  }
}

export function readStoredJson(key: string, storage: KeyValueStorage | null = getBrowserStorage()): unknown | undefined {
  if (!storage) return undefined
  try {
    const raw = storage.getItem(key)
    return raw === null ? undefined : JSON.parse(raw)
  } catch {
    return undefined
  }
}

export function writeStoredJson(key: string, value: unknown, storage: KeyValueStorage | null = getBrowserStorage()): void {
  if (!storage) return
  try {
    storage.setItem(key, JSON.stringify(value))
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
