import { appendSegment, type JSONPatchOperation, type Pointer } from 'zod-crud'

/** JSON-patch ops accepted by `ops.patch()`. Value typed loosely; site narrows as needed. */
export type Patch = Array<Extract<JSONPatchOperation, { op: 'add' | 'replace' | 'remove' }>>

interface PatchOps { patch(patch: ReadonlyArray<JSONPatchOperation>): unknown }
interface AddOps { add(path: string, value: unknown): unknown }
interface ReplaceOps { replace(path: string, value: unknown): unknown }
interface RemoveOps { remove(path: string): unknown }
type Equal<V> = (a: V, b: V) => boolean

const defaultEqual = <V>(a: V, b: V): boolean => a === b

export interface RecordMutationCommands<V> {
  replaceExisting?: (entries: Array<[string, V]>) => boolean
  ensureMissing?: (entries: Array<[string, V]>) => boolean
}

export function applyPatch(ops: PatchOps, patch: Patch): void {
  if (patch.length > 0) ops.patch(patch)
}

export function addValue<V>(ops: AddOps, path: string, value: V): void {
  ops.add(path, value)
}

export function replaceValue<V>(ops: ReplaceOps, path: string, value: V): void {
  ops.replace(path, value)
}

export function removeValue(ops: RemoveOps, path: string): void {
  ops.remove(path)
}

const childPath = (base: string, key: string): string =>
  appendSegment(base as Pointer, key)

/**
 * Surgical add/replace/remove for one key inside a dict-record stored in the SSOT doc.
 * Per zod-crud guidance — avoids `ops.replace('/path', { ...all, [k]: v })` anti-pattern
 * that collapses every key into one history entry.
 */
export function upsertKey<V>(
  ops: AddOps & ReplaceOps & RemoveOps,
  base: string,
  current: Record<string, V>,
  key: string,
  value: V | undefined,
  equal: Equal<V> = defaultEqual,
  commands?: RecordMutationCommands<V>,
): void {
  const path = childPath(base, key)
  if (value === undefined) {
    if (current[key] !== undefined) removeValue(ops, path)
  } else if (current[key] === undefined) {
    if (commands?.ensureMissing?.([[key, value]])) return
    addValue(ops, path, value)
  } else if (!equal(current[key], value)) {
    if (commands?.replaceExisting?.([[key, value]])) return
    replaceValue(ops, path, value)
  }
}

/** Batch multiple key writes into a single ops.patch — atomic undo. */
export function upsertKeys<V>(
  ops: PatchOps,
  base: string,
  current: Record<string, V>,
  entries: Array<[string, V | undefined]>,
  equal: Equal<V> = defaultEqual,
  commands?: RecordMutationCommands<V>,
): void {
  const patch: Patch = []
  const latest = new Map(entries)
  const latestEntries = [...latest]
  if (
    commands?.replaceExisting &&
    latestEntries.length > 0 &&
    latestEntries.every((entry): entry is [string, V] => entry[1] !== undefined && current[entry[0]] !== undefined) &&
    commands.replaceExisting(latestEntries)
  ) return
  if (
    commands?.ensureMissing &&
    latestEntries.length > 0 &&
    latestEntries.every((entry): entry is [string, V] => entry[1] !== undefined && current[entry[0]] === undefined) &&
    commands.ensureMissing(latestEntries)
  ) return
  for (const [key, value] of latestEntries) {
    const path = childPath(base, key)
    if (value === undefined) { if (current[key] !== undefined) patch.push({ op: 'remove', path }) }
    else if (current[key] === undefined) patch.push({ op: 'add', path, value })
    else if (!equal(current[key], value)) patch.push({ op: 'replace', path, value })
  }
  applyPatch(ops, patch)
}
