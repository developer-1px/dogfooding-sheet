import type { JSONOps } from 'zod-crud'

/** JSON-patch ops accepted by `ops.patch()`. Value typed loosely; site narrows as needed. */
export type Patch = Array<{ op: 'add' | 'replace' | 'remove'; path: string; value?: unknown }>

interface PatchOps { patch(patch: never): unknown }
interface AddOps { add(path: never, value: never): unknown }
interface ReplaceOps { replace(path: never, value: never): unknown }
interface RemoveOps { remove(path: never): unknown }

export function applyPatch(ops: PatchOps, patch: Patch): void {
  if (patch.length > 0) ops.patch(patch as never)
}

export function addValue<V>(ops: AddOps, path: string, value: V): void {
  ops.add(path as never, value as never)
}

export function replaceValue<V>(ops: ReplaceOps, path: string, value: V): void {
  ops.replace(path as never, value as never)
}

export function removeValue(ops: RemoveOps, path: string): void {
  ops.remove(path as never)
}

const escapePathSegment = (segment: string): string =>
  segment.replace(/~/g, '~0').replace(/\//g, '~1')

const childPath = (base: string, key: string): string =>
  `${base}/${escapePathSegment(key)}`

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
  const path = childPath(base, key)
  if (value === undefined) {
    if (current[key] !== undefined) removeValue(ops, path)
  } else if (current[key] === undefined) {
    addValue(ops, path, value)
  } else if (current[key] !== value) {
    replaceValue(ops, path, value)
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
    const path = childPath(base, key)
    if (value === undefined) { if (current[key] !== undefined) patch.push({ op: 'remove', path }) }
    else if (current[key] === undefined) patch.push({ op: 'add', path, value })
    else if (current[key] !== value) patch.push({ op: 'replace', path, value })
  }
  applyPatch(ops, patch)
}
