import type { JSONOps } from 'zod-crud'

/** JSON-patch ops accepted by `ops.patch()`. Value typed loosely; site narrows as needed. */
export type Patch = Array<{ op: 'add' | 'replace' | 'remove'; path: string; value?: unknown }>

/**
 * Surgical add/replace/remove for one key inside a dict-record stored in the SSOT doc.
 * Per zod-crud guidance — avoids `ops.replace('/path', { ...all, [k]: v })` anti-pattern
 * that collapses every key into one history entry.
 */
export function upsertKey<T, V>(
  ops: JSONOps<T>,
  base: string,
  current: Record<string, V>,
  key: string,
  value: V | undefined,
): void {
  const path = `${base}/${key}` as never
  if (value === undefined) {
    if (current[key] !== undefined) ops.remove(path)
  } else if (current[key] === undefined) {
    ops.add(path, value as never)
  } else if (current[key] !== value) {
    ops.replace(path, value as never)
  }
}

/** Batch multiple key writes into a single ops.patch — atomic undo. */
export function upsertKeys<T, V>(
  ops: JSONOps<T>,
  base: string,
  current: Record<string, V>,
  entries: Array<[string, V | undefined]>,
): void {
  const patch: Patch = []
  for (const [key, value] of entries) {
    const path = `${base}/${key}`
    if (value === undefined) { if (current[key] !== undefined) patch.push({ op: 'remove', path }) }
    else if (current[key] === undefined) patch.push({ op: 'add', path, value })
    else if (current[key] !== value) patch.push({ op: 'replace', path, value })
  }
  if (patch.length > 0) ops.patch(patch as never)
}
