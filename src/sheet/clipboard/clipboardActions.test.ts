import { describe, it, expect } from 'vitest'
import { cellId, rectToTsv } from '@spredsheet/grid'
import { copyOrCut, pasteAt, pasteTsvAt, pasteTsvIntoSelection } from './clipboardActions'

describe('rectToTsv / pasteTsv roundtrip', () => {
  it('serializes rect to tab-separated rows', () => {
    const cells: Record<string, string> = { A1: 'a', B1: 'b', A2: '1', B2: '2' }
    const tsv = rectToTsv({ rMin: 0, rMax: 1, cMin: 0, cMax: 1 }, (k) => cells[k] ?? '')
    expect(tsv).toBe('a\tb\n1\t2')
  })
  it('paste writes cells anchored at target', () => {
    const written: Record<string, string> = {}
    pasteTsvAt('x\ty\n1\t2', { col: 'B', row: 1 }, (k, v) => { written[k] = v })
    expect(written).toEqual({ B2: 'x', C2: 'y', B3: '1', C3: '2' })
  })

  it('fills every selected cell when pasting a single clipboard value', () => {
    const written: Record<string, string> = {}
    pasteTsvIntoSelection(
      'done',
      [cellId('B', 1), cellId('C', 1), cellId('B', 2), cellId('C', 2)],
      { col: 'B', row: 1 },
      (k, v) => { written[k] = v },
    )
    expect(written).toEqual({ B2: 'done', C2: 'done', B3: 'done', C3: 'done' })
  })

  it('tiles a smaller clipboard block across the selected range', () => {
    const written: Record<string, string> = {}
    pasteTsvIntoSelection(
      'x\ty',
      [cellId('A', 0), cellId('B', 0), cellId('A', 1), cellId('B', 1)],
      { col: 'A', row: 0 },
      (k, v) => { written[k] = v },
    )
    expect(written).toEqual({ A1: 'x', B1: 'y', A2: 'x', B2: 'y' })
  })

  it('adjusts formula references when pasting an internal copy', async () => {
    let clipboardText = ''
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: (text: string) => { clipboardText = text; return Promise.resolve() },
        readText: () => Promise.resolve(clipboardText),
      },
    })
    const written: Record<string, string> = {}
    copyOrCut([cellId('B', 1)], false, { B2: '=A1' }, (k, v) => { written[k] = v })
    pasteAt('B3', { col: 'B', row: 2 }, 20, (k, v) => { written[k] = v })
    await Promise.resolve()
    expect(written).toEqual({ B3: '=A2' })
  })

  it('preserves absolute row and column markers when offsetting pasted formulas', async () => {
    let clipboardText = ''
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: (text: string) => { clipboardText = text; return Promise.resolve() },
        readText: () => Promise.resolve(clipboardText),
      },
    })
    const written: Record<string, string> = {}
    copyOrCut([cellId('B', 1)], false, { B2: '=$A$1+A$1+$A1+A1' }, (k, v) => { written[k] = v })
    pasteAt('C3', { col: 'C', row: 2 }, 20, (k, v) => { written[k] = v })
    await Promise.resolve()
    expect(written).toEqual({ C3: '=$A$1+B$1+$A2+B2' })
  })

  it('adjusts formula references across a selected paste range', async () => {
    let clipboardText = ''
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: (text: string) => { clipboardText = text; return Promise.resolve() },
        readText: () => Promise.resolve(clipboardText),
      },
    })
    const written: Record<string, string> = {}
    copyOrCut([cellId('B', 1)], false, { B2: '=A1' }, (k, v) => { written[k] = v })
    pasteAt(
      'B3',
      { col: 'B', row: 2 },
      20,
      (k, v) => { written[k] = v },
      undefined,
      undefined,
      [cellId('B', 2), cellId('C', 2), cellId('B', 3), cellId('C', 3)],
    )
    await Promise.resolve()
    expect(written).toEqual({ B3: '=A2', C3: '=B2', B4: '=A3', C4: '=B3' })
  })
})
