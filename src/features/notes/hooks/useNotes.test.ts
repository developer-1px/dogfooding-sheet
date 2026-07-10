import { describe, expect, it } from 'vitest'
import { MAX_CELL_TEXT_LENGTH } from '../../../entities/CellValue/cellValue'
import { coerceLegacyNotes } from './useNotes'

describe('coerceLegacyNotes', () => {
  it('normalizes legacy notes through current text and bounds rules', () => {
    expect(coerceLegacyNotes({
      A1: ' note\r\ntext ',
      B1: '',
      C1: 'outside col',
      A3: 'outside row',
      A2: 'x'.repeat(MAX_CELL_TEXT_LENGTH + 1),
      'bad/key': 'bad',
      B2: 123,
    }, { rowCount: 2, colCount: 2 })).toEqual({
      A1: 'note\ntext',
    })
  })

  it('returns undefined when no legacy note survives coercion', () => {
    expect(coerceLegacyNotes({ A1: '', B1: 'x'.repeat(MAX_CELL_TEXT_LENGTH + 1) })).toBeUndefined()
    expect(coerceLegacyNotes(null)).toBeUndefined()
  })
})
