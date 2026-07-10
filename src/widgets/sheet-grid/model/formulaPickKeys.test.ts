import { describe, expect, it } from 'vitest'
import { formulaPickDeltaForKey } from './formulaPickKeys'

describe('formulaPickDeltaForKey', () => {
  it('maps arrow keys to formula reference movement', () => {
    expect(formulaPickDeltaForKey('ArrowUp')).toEqual({ dRow: -1, dCol: 0 })
    expect(formulaPickDeltaForKey('ArrowDown')).toEqual({ dRow: 1, dCol: 0 })
    expect(formulaPickDeltaForKey('ArrowLeft')).toEqual({ dRow: 0, dCol: -1 })
    expect(formulaPickDeltaForKey('ArrowRight')).toEqual({ dRow: 0, dCol: 1 })
  })

  it('ignores non-navigation keys', () => {
    expect(formulaPickDeltaForKey('Enter')).toBeNull()
  })
})
