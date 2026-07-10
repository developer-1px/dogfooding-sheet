import { describe, expect, it } from 'vitest'
import {
  clearAllFormatsPatch,
  clearCellValuesPatch,
  applyToolbarFormat,
  applyToolbarAutoSum,
  clearToolbarStyle,
  promptToolbarFilter,
  setToolbarAlignment,
  setToolbarColor,
  targetCellKeys,
  toggleToolbarStyle,
} from './toolbarActions'
import type { Ask, PromptOptions } from '../../../shared/ports/dialog'
import { MAX_CELL_TEXT_LENGTH } from '../../../entities/CellValue/cellValue'

function askValue(value: string | null, prompts: PromptOptions[] = []): Ask {
  return (opts) => {
    prompts.push(opts)
    return Promise.resolve(value)
  }
}

const rejectingAsk = (): Ask => () => Promise.reject(new Error('closed'))

describe('toolbarActions', () => {
  it('resolves toolbar target keys from selection or focused key', () => {
    expect(targetCellKeys(['r0-A', 'r1-B'], 'C3')).toEqual(['A1', 'B2'])
    expect(targetCellKeys([], 'C3')).toEqual(['C3'])
    expect(targetCellKeys([], null)).toEqual([])
  })

  it('deduplicates and drops invalid toolbar target keys', () => {
    expect(targetCellKeys(['r0-A', 'r0-A', 'bad-id', 'r1-B'], 'C3')).toEqual(['A1', 'B2'])
    expect(targetCellKeys([], 'A0')).toEqual([])
  })

  it('applies an auto-sum formula at the focused cell', () => {
    const calls: string[] = []
    const wrote = applyToolbarAutoSum({
      focusKey: 'B4',
      display: (key) => ({ B1: 'Qty', B2: '3', B3: '4' })[key] ?? '',
      writeCell: (key, value) => calls.push(`${key}:${value}`),
    })

    expect(wrote).toBe(true)
    expect(calls).toEqual(['B4:=SUM(B2:B3)'])
  })

  it('does not write auto-sum when no contiguous numbers exist', () => {
    const calls: string[] = []

    expect(applyToolbarAutoSum({
      focusKey: 'A1',
      display: () => '',
      writeCell: (key, value) => calls.push(`${key}:${value}`),
    })).toBe(false)
    expect(calls).toEqual([])
  })

  it('prompts for the focused column filter and applies, clears, rejects, or skips it', async () => {
    const calls: string[] = []
    const prompts: PromptOptions[] = []

    await expect(promptToolbarFilter({
      ask: askValue('>1', prompts),
      focusKey: 'B2',
      filter: { col: 'B', text: 'old' },
      applyFilter: (col, text) => calls.push(`apply:${col}:${text}`),
      clearFilter: () => calls.push('clear'),
    })).resolves.toBe('applied')
    expect(prompts[0]).toMatchObject({ label: 'B열에서 찾을 값', initial: 'old', submitLabel: '필터' })

    await expect(promptToolbarFilter({
      ask: askValue(''),
      focusKey: 'B2',
      filter: null,
      applyFilter: (col, text) => calls.push(`apply:${col}:${text}`),
      clearFilter: () => calls.push('clear'),
    })).resolves.toBe('cleared')

    await expect(promptToolbarFilter({
      ask: askValue('ignored'),
      focusKey: null,
      filter: null,
      applyFilter: (col, text) => calls.push(`apply:${col}:${text}`),
      clearFilter: () => calls.push('clear'),
    })).resolves.toBe('no-target')

    await expect(promptToolbarFilter({
      ask: askValue(' '.repeat(3)),
      focusKey: 'B2',
      filter: null,
      applyFilter: (col, text) => calls.push(`apply:${col}:${text}`),
      clearFilter: () => calls.push('clear'),
    })).resolves.toBe('cleared')

    await expect(promptToolbarFilter({
      ask: askValue('x'.repeat(MAX_CELL_TEXT_LENGTH + 1)),
      focusKey: 'B2',
      filter: null,
      applyFilter: (col, text) => calls.push(`apply:${col}:${text}`),
      clearFilter: () => calls.push('clear'),
    })).resolves.toBe('invalid')

    expect(calls).toEqual(['apply:B:>1', 'clear', 'clear'])
  })

  it('treats rejected filter prompts as cancelled', async () => {
    const calls: string[] = []

    await expect(promptToolbarFilter({
      ask: rejectingAsk(),
      focusKey: 'B2',
      filter: null,
      applyFilter: (col, text) => calls.push(`apply:${col}:${text}`),
      clearFilter: () => calls.push('clear'),
    })).resolves.toBe('cancelled')

    expect(calls).toEqual([])
  })

  it('applies number formats to the target keys', () => {
    const calls: string[] = []

    expect(applyToolbarFormat({
      selectedIds: ['r0-A', 'r1-A'],
      focusKey: 'C3',
      format: 'currency',
      setFormat: (keys, format) => calls.push(`${keys.join('|')}:${format}`),
    })).toBe(true)
    expect(applyToolbarFormat({
      selectedIds: [],
      focusKey: null,
      format: 'plain',
      setFormat: (keys, format) => calls.push(`${keys.join('|')}:${format}`),
    })).toBe(false)

    expect(calls).toEqual(['A1|A2:currency'])
  })

  it('toggles style flags using the focused cell as the pressed state source', () => {
    const calls: Array<{ keys: string[]; patch: object }> = []

    expect(toggleToolbarStyle({
      selectedIds: ['r0-A', 'r0-B'],
      focusKey: 'B1',
      flag: 'b',
      styleOf: (key) => key === 'B1' ? { b: true } : undefined,
      updateStyle: (keys, patch) => calls.push({ keys, patch }),
    })).toBe(true)
    expect(toggleToolbarStyle({
      selectedIds: [],
      focusKey: 'C3',
      flag: 'i',
      styleOf: () => undefined,
      updateStyle: (keys, patch) => calls.push({ keys, patch }),
    })).toBe(true)

    expect(calls).toEqual([
      { keys: ['A1', 'B1'], patch: { b: false } },
      { keys: ['C3'], patch: { i: true } },
    ])
  })

  it('sets alignment, colors, and clear style patches for target keys', () => {
    const calls: Array<{ keys: string[]; patch: object }> = []
    const updateStyle = (keys: string[], patch: object) => calls.push({ keys, patch })

    expect(setToolbarAlignment({
      selectedIds: [],
      focusKey: 'D4',
      alignment: 'center',
      updateStyle,
    })).toBe(true)
    expect(setToolbarColor({
      selectedIds: ['r1-B'],
      focusKey: 'D4',
      target: 'bg',
      color: '#ff0000',
      updateStyle,
    })).toBe(true)
    expect(setToolbarColor({
      selectedIds: [],
      focusKey: 'D4',
      target: 'fg',
      color: '#0000ff',
      updateStyle,
    })).toBe(true)
    expect(setToolbarColor({
      selectedIds: [],
      focusKey: 'D4',
      target: 'bg',
      color: 'red',
      updateStyle,
    })).toBe(false)
    expect(clearToolbarStyle({
      selectedIds: [],
      focusKey: 'D4',
      updateStyle,
    })).toBe(true)

    expect(calls).toEqual([
      { keys: ['D4'], patch: { a: 'center' } },
      { keys: ['B2'], patch: { bg: '#ff0000' } },
      { keys: ['D4'], patch: { fg: '#0000ff' } },
      {
        keys: ['D4'],
        patch: { b: false, i: false, u: false, s: false, w: false, bd: false, a: undefined, bg: '', fg: '' },
      },
    ])
  })

  it('builds no-op clear patches when values and formats are already empty', () => {
    expect(clearCellValuesPatch({})).toEqual([])
    expect(clearAllFormatsPatch({ styles: {}, formats: {}, condFormat: [] })).toEqual([])
  })

  it('builds clear patches only for populated values and format state', () => {
    expect(clearCellValuesPatch({ A1: 'x' })).toEqual([
      { op: 'replace', path: '/cells', value: {} },
    ])
    expect(clearAllFormatsPatch({
      styles: { A1: { b: true } },
      formats: {},
      condFormat: [{ col: 'A', op: '>', value: '1', color: '#fff' }],
    })).toEqual([
      { op: 'replace', path: '/styles', value: {} },
      { op: 'replace', path: '/condFormat', value: [] },
    ])
  })
})
