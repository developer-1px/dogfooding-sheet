import { describe, expect, it } from 'vitest'
import { normalizeNoteText } from './noteText'

describe('normalizeNoteText', () => {
  it('trims empty padding while preserving markdown text', () => {
    expect(normalizeNoteText('  **todo**\n- item  ')).toBe('**todo**\n- item')
  })

  it('normalizes CRLF and CR line endings', () => {
    expect(normalizeNoteText('a\r\nb\rc')).toBe('a\nb\nc')
  })

  it('returns an empty string for whitespace-only notes', () => {
    expect(normalizeNoteText(' \n\t ')).toBe('')
  })
})
