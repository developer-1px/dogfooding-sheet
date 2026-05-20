import { describe, expect, it } from 'vitest'
import type { SheetOps } from '../schema'
import { coerceLegacyStyles, styleToProps, updateStyleValues } from './useStyles'

const recordingOps = () => {
  const calls: unknown[] = []
  return {
    calls,
    ops: {
      patch: (patch: never) => { calls.push(['patch', patch]) },
    } as unknown as SheetOps,
  }
}

describe('style coercion', () => {
  it('coerces legacy styles through current bounds and color rules', () => {
    expect(coerceLegacyStyles({
      A1: { b: true, i: false, a: 'center', bg: '#ff0000', fg: 'red' },
      B1: { fg: '#000' },
      C1: { b: true },
      A3: { b: true },
      'bad/key': { b: true },
    }, { rowCount: 2, colCount: 2 })).toEqual({
      A1: { b: true, a: 'center', bg: '#ff0000' },
      B1: { fg: '#000' },
    })
  })

  it('returns undefined when no legacy style survives coercion', () => {
    expect(coerceLegacyStyles({ A1: { bg: 'red' }, B1: { i: false } })).toBeUndefined()
    expect(coerceLegacyStyles(null)).toBeUndefined()
  })

  it('does not expose invalid colors as React style props', () => {
    expect(styleToProps({ bg: 'red', fg: '#111' }).style).toEqual({ color: '#111' })
  })

  it('skips style writes when the normalized style is unchanged', () => {
    const { ops, calls } = recordingOps()

    updateStyleValues({ A1: { a: 'left' }, B1: { b: true } }, ops, ['A1', 'B1', 'C1'], { a: 'left' }, { rowCount: 1, colCount: 3 })

    expect(calls).toEqual([
      ['patch', [
        { op: 'replace', path: '/styles/B1', value: { b: true, a: 'left' } },
        { op: 'add', path: '/styles/C1', value: { a: 'left' } },
      ]],
    ])
  })
})
