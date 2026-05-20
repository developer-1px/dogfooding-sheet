import { describe, expect, it } from 'vitest'
import { coerceLegacyFreeze } from './useFreeze'

describe('coerceLegacyFreeze', () => {
  it('clamps legacy freeze counts to sheet bounds', () => {
    expect(coerceLegacyFreeze({ rows: 5, cols: 3 }, { rowCount: 2, colCount: 2 })).toEqual({ rows: 2, cols: 2 })
  })

  it('drops invalid or empty legacy freeze state', () => {
    expect(coerceLegacyFreeze({ rows: 1.5, cols: -1 }, { rowCount: 2, colCount: 2 })).toBeUndefined()
    expect(coerceLegacyFreeze({ rows: 0, cols: 0 })).toBeUndefined()
    expect(coerceLegacyFreeze(null)).toBeUndefined()
  })
})
