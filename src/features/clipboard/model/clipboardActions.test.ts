import { describe, it, expect } from 'vitest'
import { cellId, MAX_TSV_TEXT_LENGTH, rectToTsv } from '@spredsheet/grid'
import { copyOrCut, cutSingleCell, pasteAt, pasteSingleCell, pasteTsvAt, pasteTsvIntoSelection } from './clipboardActions'

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

  it('delegates rectangular TSV paste to a range writer when available', () => {
    const written: Record<string, string> = {}
    const ranges: unknown[] = []

    pasteTsvAt('x\ty\n1\t2', { col: 'B', row: 1 }, (k, v) => { written[k] = v }, {
      writeRange: (range, matrix) => {
        ranges.push({ range, matrix })
        return true
      },
    })

    expect(ranges).toEqual([{
      range: { rMin: 1, rMax: 2, cMin: 1, cMax: 2 },
      matrix: [['x', 'y'], ['1', '2']],
    }])
    expect(written).toEqual({})
  })

  it('falls back to cell writes for ragged TSV paste', () => {
    const written: Record<string, string> = {}
    const ranges: unknown[] = []

    pasteTsvAt('x\ty\n1', { col: 'A', row: 0 }, (k, v) => { written[k] = v }, {
      writeRange: (range, matrix) => {
        ranges.push({ range, matrix })
        return true
      },
    })

    expect(ranges).toEqual([])
    expect(written).toEqual({ A1: 'x', B1: 'y', A2: '1' })
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

  it('delegates selected rectangular paste as a full tiled matrix', () => {
    const written: Record<string, string> = {}
    const ranges: unknown[] = []

    pasteTsvIntoSelection(
      'x\ty',
      [cellId('A', 0), cellId('B', 0), cellId('A', 1), cellId('B', 1)],
      { col: 'A', row: 0 },
      (k, v) => { written[k] = v },
      {
        writeRange: (range, matrix) => {
          ranges.push({ range, matrix })
          return true
        },
      },
    )

    expect(ranges).toEqual([{
      range: { rMin: 0, rMax: 1, cMin: 0, cMax: 1 },
      matrix: [['x', 'y'], ['x', 'y']],
    }])
    expect(written).toEqual({})
  })

  it('does not clear cells when cut serialization exceeds the clipboard limit', async () => {
    let clipboardText = 'unchanged'
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: (text: string) => { clipboardText = text; return Promise.resolve() },
        readText: () => Promise.resolve(clipboardText),
      },
    })
    const written: Record<string, string> = {}
    await expect(copyOrCut([cellId('A', 0)], true, { A1: `${'x'.repeat(MAX_TSV_TEXT_LENGTH)}x` }, (k, v) => { written[k] = v })).resolves.toBe(false)
    expect(written).toEqual({})
    expect(clipboardText).toBe('unchanged')
  })

  it('does not clear cut cells when clipboard write fails', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: () => Promise.reject(new Error('denied')),
        readText: () => Promise.reject(new Error('denied')),
      },
    })
    const written: Record<string, string> = {}

    await expect(copyOrCut([cellId('A', 0)], true, { A1: 'keep' }, (k, v) => { written[k] = v })).resolves.toBe(false)

    expect(written).toEqual({})
  })

  it('clears cut cells only after clipboard write succeeds', async () => {
    let clipboardText = ''
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: (text: string) => { clipboardText = text; return Promise.resolve() },
        readText: () => Promise.resolve(clipboardText),
      },
    })
    const writes: string[] = []

    await expect(copyOrCut(
      [cellId('A', 0), cellId('B', 0)],
      true,
      { A1: 'cut', B1: 'me' },
      (key, value) => writes.push(`cell:${key}:${value}`),
      (batch) => writes.push(`batch:${batch.map(([key, value]) => `${key}:${value}`).join('|')}`),
    )).resolves.toBe(true)

    expect(clipboardText).toBe('cut\tme')
    expect(writes).toEqual(['batch:A1:|B1:'])
  })

  it('reports a failed cut when clearing cells throws', async () => {
    let clipboardText = ''
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: (text: string) => { clipboardText = text; return Promise.resolve() },
        readText: () => Promise.resolve(clipboardText),
      },
    })

    await expect(copyOrCut([cellId('A', 0)], true, { A1: 'keep' }, () => { throw new Error('blocked') })).resolves.toBe(false)
    expect(clipboardText).toBe('keep')
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
    await copyOrCut([cellId('B', 1)], false, { B2: '=A1' }, (k, v) => { written[k] = v })
    await pasteAt('B3', { col: 'B', row: 2 }, 20, (k, v) => { written[k] = v })
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
    await copyOrCut([cellId('B', 1)], false, { B2: '=$A$1+A$1+$A1+A1' }, (k, v) => { written[k] = v })
    await pasteAt('C3', { col: 'C', row: 2 }, 20, (k, v) => { written[k] = v })
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
    await copyOrCut([cellId('B', 1)], false, { B2: '=A1' }, (k, v) => { written[k] = v })
    await pasteAt(
      'B3',
      { col: 'B', row: 2 },
      20,
      (k, v) => { written[k] = v },
      undefined,
      undefined,
      [cellId('B', 2), cellId('C', 2), cellId('B', 3), cellId('C', 3)],
    )
    expect(written).toEqual({ B3: '=A2', C3: '=B2', B4: '=A3', C4: '=B3' })
  })

  it('uses the internal clipboard when clipboard read fails', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: () => Promise.resolve(),
        readText: () => Promise.reject(new Error('denied')),
      },
    })
    const written: Record<string, string> = {}

    await copyOrCut([cellId('B', 1)], false, { B2: '=A1' }, (k, v) => { written[k] = v })
    await expect(pasteAt('B3', { col: 'B', row: 2 }, 20, (k, v) => { written[k] = v })).resolves.toBe(true)

    expect(written).toEqual({ B3: '=A2' })
  })

  it('can use an injected text clipboard bridge', async () => {
    let clipboardText = ''
    const bridge = {
      readText: () => Promise.resolve(clipboardText),
      writeText: (text: string) => {
        clipboardText = text
        return Promise.resolve(true)
      },
    }
    const written: Record<string, string> = {}

    await expect(copyOrCut([cellId('A', 0), cellId('B', 0)], false, { A1: 'left', B1: 'right' }, (k, v) => { written[k] = v }, undefined, bridge)).resolves.toBe(true)
    expect(clipboardText).toBe('left\tright')

    clipboardText = 'external'
    await expect(pasteAt('C3', { col: 'C', row: 2 }, 20, (k, v) => { written[k] = v }, undefined, undefined, [], bridge)).resolves.toBe(true)
    expect(written).toEqual({ C3: 'external' })
  })

  it('does not clear a single cut cell when clipboard write fails', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: () => Promise.reject(new Error('denied')),
        readText: () => Promise.reject(new Error('denied')),
      },
    })
    const written: Record<string, string> = {}

    await expect(cutSingleCell('keep', 'A1', (k, v) => { written[k] = v })).resolves.toBe(false)

    expect(written).toEqual({})
  })

  it('reports false when single-cell cut or paste writes fail', async () => {
    let clipboardText = ''
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: (text: string) => { clipboardText = text; return Promise.resolve() },
        readText: () => Promise.resolve(clipboardText),
      },
    })

    await expect(cutSingleCell('keep', 'A1', () => { throw new Error('blocked') })).resolves.toBe(false)
    expect(clipboardText).toBe('keep')

    clipboardText = 'paste'
    await expect(pasteSingleCell('A1', () => { throw new Error('blocked') })).resolves.toBe(false)
  })
})
