import { describe, expect, it } from 'vitest'
import {
  applyCheckboxValidation,
  applyToolbarFormat,
  applyToolbarAutoSum,
  clearToolbarStyle,
  promptListValidation,
  promptToolbarFilter,
  setToolbarAlignment,
  setToolbarColor,
  targetCellKeys,
  toggleToolbarStyle,
  validationOptionsFromCsv,
} from './toolbarActions'
import type { Ask, PromptOptions } from './usePrompt'

function askValue(value: string | null, prompts: PromptOptions[] = []): Ask {
  return (opts) => {
    prompts.push(opts)
    return Promise.resolve(value)
  }
}

describe('toolbarActions', () => {
  it('resolves toolbar target keys from selection or focused key', () => {
    expect(targetCellKeys(['r0-A', 'r1-B'], 'C3')).toEqual(['A1', 'B2'])
    expect(targetCellKeys([], 'C3')).toEqual(['C3'])
    expect(targetCellKeys([], null)).toEqual([])
  })

  it('parses comma-separated validation options', () => {
    expect(validationOptionsFromCsv(' open,closed,  pending ,,')).toEqual(['open', 'closed', 'pending'])
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

  it('prompts for the focused column filter and applies, clears, or skips it', async () => {
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

    expect(calls).toEqual(['apply:B:>1', 'clear'])
  })

  it('prompts for list validation and applies or clears the target keys', async () => {
    const calls: string[] = []
    const prompts: PromptOptions[] = []

    await expect(promptListValidation({
      ask: askValue('yes, no', prompts),
      selectedIds: ['r0-A', 'r1-A'],
      focusKey: 'C3',
      setListRule: (keys, options) => calls.push(`list:${keys.join('|')}:${options.join('|')}`),
      clearRule: (keys) => calls.push(`clear:${keys.join('|')}`),
    })).resolves.toBe('applied')

    await expect(promptListValidation({
      ask: askValue(''),
      selectedIds: [],
      focusKey: 'C3',
      setListRule: (keys, options) => calls.push(`list:${keys.join('|')}:${options.join('|')}`),
      clearRule: (keys) => calls.push(`clear:${keys.join('|')}`),
    })).resolves.toBe('cleared')

    expect(prompts[0]).toMatchObject({ label: '허용 값 (쉼표 구분, 비우면 해제)', submitLabel: '적용' })
    expect(calls).toEqual(['list:A1|A2:yes|no', 'clear:C3'])
  })

  it('does not prompt list validation when there is no target', async () => {
    const prompts: PromptOptions[] = []
    const result = await promptListValidation({
      ask: askValue('yes', prompts),
      selectedIds: [],
      focusKey: null,
      setListRule: () => { throw new Error('setListRule should not run') },
      clearRule: () => { throw new Error('clearRule should not run') },
    })

    expect(result).toBe('no-target')
    expect(prompts).toEqual([])
  })

  it('applies checkbox validation to selection or focus', () => {
    const calls: string[] = []

    expect(applyCheckboxValidation({
      selectedIds: ['r1-B'],
      focusKey: 'C3',
      setCheckboxRule: (keys) => calls.push(keys.join('|')),
    })).toBe(true)
    expect(applyCheckboxValidation({
      selectedIds: [],
      focusKey: null,
      setCheckboxRule: (keys) => calls.push(keys.join('|')),
    })).toBe(false)

    expect(calls).toEqual(['B2'])
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
})
