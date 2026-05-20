export const MAX_JSON_STRINGIFY_LENGTH = 5_000_000

export interface BoundedJsonStringifyOptions {
  maxLength?: number
  space?: number | string
}

const stringifyLimit = (maxLength: number | undefined): number =>
  maxLength === undefined || !Number.isFinite(maxLength)
    ? MAX_JSON_STRINGIFY_LENGTH
    : Math.max(0, Math.floor(maxLength))

const indentUnit = (space: number | string | undefined): string => {
  if (typeof space === 'number') return ' '.repeat(Math.max(0, Math.min(10, Math.floor(space))))
  if (typeof space === 'string') return space.slice(0, 10)
  return ''
}

const primitiveJson = (value: unknown, inArray: boolean): string | undefined => {
  if (value === null) return 'null'
  if (typeof value === 'string') return JSON.stringify(value)
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : 'null'
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (typeof value === 'bigint') throw new TypeError('BigInt is not JSON serializable')
  if (typeof value === 'object') return undefined
  return inArray ? 'null' : undefined
}

const objectValueSerializable = (value: unknown): boolean =>
  value !== undefined && typeof value !== 'function' && typeof value !== 'symbol'

export function stringifyJsonBounded(value: unknown, opts: BoundedJsonStringifyOptions = {}): string | null {
  const maxLength = stringifyLimit(opts.maxLength)
  const unit = indentUnit(opts.space)
  const pretty = unit.length > 0
  const parts: string[] = []
  const seen = new WeakSet<object>()
  let length = 0

  const push = (part: string): boolean => {
    length += part.length
    if (length > maxLength) return false
    parts.push(part)
    return true
  }

  const newline = (depth: number): boolean =>
    pretty ? push(`\n${unit.repeat(depth)}`) : true

  const write = (nextValue: unknown, depth: number, inArray: boolean): boolean => {
    const primitive = primitiveJson(nextValue, inArray)
    if (primitive !== undefined) return push(primitive)
    if (typeof nextValue !== 'object' || nextValue === null) return false

    if (seen.has(nextValue)) throw new TypeError('Converting circular structure to JSON')
    seen.add(nextValue)

    if (Array.isArray(nextValue)) {
      if (nextValue.length === 0) { seen.delete(nextValue); return push('[]') }
      if (!push('[')) return false
      for (let index = 0; index < nextValue.length; index++) {
        if (index > 0 && !push(',')) return false
        if (!newline(depth + 1)) return false
        if (!write(nextValue[index], depth + 1, true)) return false
      }
      if (!newline(depth) || !push(']')) return false
      seen.delete(nextValue)
      return true
    }

    const entries = Object.keys(nextValue)
      .map((key) => [key, (nextValue as Record<string, unknown>)[key]] as const)
      .filter((entry) => objectValueSerializable(entry[1]))
    if (entries.length === 0) { seen.delete(nextValue); return push('{}') }
    if (!push('{')) return false
    for (let index = 0; index < entries.length; index++) {
      const [key, entryValue] = entries[index]
      if (index > 0 && !push(',')) return false
      if (!newline(depth + 1)) return false
      if (!push(JSON.stringify(key)) || !push(pretty ? ': ' : ':')) return false
      if (!write(entryValue, depth + 1, false)) return false
    }
    if (!newline(depth) || !push('}')) return false
    seen.delete(nextValue)
    return true
  }

  try {
    return write(value, 0, false) ? parts.join('') : null
  } catch {
    return null
  }
}
