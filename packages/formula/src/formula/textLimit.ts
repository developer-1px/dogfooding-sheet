export const MAX_GENERATED_TEXT_LENGTH = 10_000

export const boundedText = (value: string): string | null =>
  value.length <= MAX_GENERATED_TEXT_LENGTH ? value : null

export const boundedJoin = (parts: readonly string[], separator = ''): string | null => {
  let length = 0
  for (let i = 0; i < parts.length; i++) {
    if (i > 0) length += separator.length
    length += parts[i].length
    if (length > MAX_GENERATED_TEXT_LENGTH) return null
  }
  return parts.join(separator)
}

export const boundedLength = (value: number): number | null => {
  const n = Math.floor(value)
  return Number.isFinite(n) && n >= 0 && n <= MAX_GENERATED_TEXT_LENGTH ? n : null
}

export const boundedRepeat = (text: string, count: number): string | null => {
  const n = boundedLength(count)
  if (n === null) return null
  if (text.length > 0 && n > Math.floor(MAX_GENERATED_TEXT_LENGTH / text.length)) return null
  return text.repeat(n)
}

export const boundedPadStart = (text: string, targetLength: number, pad: string): string | null => {
  const n = boundedLength(targetLength)
  return n === null ? null : text.padStart(n, pad)
}

export const boundedPadEnd = (text: string, targetLength: number, pad: string): string | null => {
  const n = boundedLength(targetLength)
  return n === null ? null : text.padEnd(n, pad)
}
