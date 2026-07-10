import { describe, expect, it } from 'vitest'
import { applyHiddenChange, coerceLegacyHidden, nextHiddenState, normalizeHiddenState, type HiddenMutationCommands, type HiddenState } from './useHidden'
import type { SheetOps } from '../../../entities/Sheet/schema'

const ok = { ok: true as const }

const opsWithReplaceCalls = (calls: string[]): SheetOps => ({
  add: () => ok,
  remove: () => ok,
  replace: (path, value) => { calls.push(`${path}:${JSON.stringify(value)}`); return ok },
  patch: () => ok,
  undo: () => true,
  redo: () => true,
  canUndo: () => false,
  canRedo: () => false,
})

describe('nextHiddenState', () => {
  const hidden: HiddenState = { rows: [1], cols: ['B'] }

  it('adds hidden rows and columns without mutating the current state', () => {
    expect(nextHiddenState(hidden, { type: 'hideRow', row: 3 })).toEqual({ rows: [1, 3], cols: ['B'] })
    expect(nextHiddenState(hidden, { type: 'hideCol', col: 'D' })).toEqual({ rows: [1], cols: ['B', 'D'] })
    expect(hidden).toEqual({ rows: [1], cols: ['B'] })
  })

  it('returns null for duplicate hide requests', () => {
    expect(nextHiddenState(hidden, { type: 'hideRow', row: 1 })).toBeNull()
    expect(nextHiddenState(hidden, { type: 'hideCol', col: 'B' })).toBeNull()
  })

  it('removes hidden rows and columns only when present', () => {
    expect(nextHiddenState(hidden, { type: 'showRow', row: 1 })).toEqual({ rows: [], cols: ['B'] })
    expect(nextHiddenState(hidden, { type: 'showCol', col: 'B' })).toEqual({ rows: [1], cols: [] })
    expect(nextHiddenState(hidden, { type: 'showRow', row: 4 })).toBeNull()
    expect(nextHiddenState(hidden, { type: 'showCol', col: 'C' })).toBeNull()
  })

  it('clears all hidden rows and columns when needed', () => {
    expect(nextHiddenState(hidden, { type: 'showAll' })).toEqual({ rows: [], cols: [] })
    expect(nextHiddenState({ rows: [], cols: [] }, { type: 'showAll' })).toBeNull()
  })

  it('ignores hide requests outside sheet bounds', () => {
    const bounds = { rowCount: 2, colCount: 2 }
    expect(nextHiddenState(hidden, { type: 'hideRow', row: 2 }, bounds)).toBeNull()
    expect(nextHiddenState(hidden, { type: 'hideCol', col: 'C' }, bounds)).toBeNull()
  })
})

describe('normalizeHiddenState', () => {
  it('dedupes hidden rows and columns within bounds', () => {
    expect(normalizeHiddenState({
      rows: [2, 0, 0, 3, 1.5],
      cols: ['B', 'B', 'C', 'A'],
    }, { rowCount: 3, colCount: 2 })).toEqual({
      rows: [0, 2],
      cols: ['B', 'A'],
    })
  })
})

describe('applyHiddenChange', () => {
  it('delegates hidden membership changes when commands are available', () => {
    const calls: string[] = []
    const opsCalls: string[] = []
    const commands: HiddenMutationCommands = {
      hideRow: (row) => { calls.push(`hideRow:${row}`); return true },
      hideCol: (col) => { calls.push(`hideCol:${col}`); return true },
      showRow: (row) => { calls.push(`showRow:${row}`); return true },
      showCol: (col) => { calls.push(`showCol:${col}`); return true },
      showAll: () => { calls.push('showAll'); return true },
    }

    expect(applyHiddenChange({ rows: [], cols: [] }, { type: 'hideRow', row: 2 }, opsWithReplaceCalls(opsCalls), undefined, commands)).toBe(true)
    expect(applyHiddenChange({ rows: [], cols: [] }, { type: 'hideCol', col: 'B' }, opsWithReplaceCalls(opsCalls), undefined, commands)).toBe(true)
    expect(applyHiddenChange({ rows: [2], cols: ['B'] }, { type: 'showRow', row: 2 }, opsWithReplaceCalls(opsCalls), undefined, commands)).toBe(true)
    expect(applyHiddenChange({ rows: [2], cols: ['B'] }, { type: 'showCol', col: 'B' }, opsWithReplaceCalls(opsCalls), undefined, commands)).toBe(true)
    expect(applyHiddenChange({ rows: [2], cols: ['B'] }, { type: 'showAll' }, opsWithReplaceCalls(opsCalls), undefined, commands)).toBe(true)

    expect(calls).toEqual(['hideRow:2', 'hideCol:B', 'showRow:2', 'showCol:B', 'showAll'])
    expect(opsCalls).toEqual([])
  })

  it('falls back to replacing the hidden object when no delegate exists', () => {
    const calls: string[] = []

    expect(applyHiddenChange({ rows: [], cols: [] }, { type: 'hideRow', row: 2 }, opsWithReplaceCalls(calls))).toBe(true)

    expect(calls).toEqual(['/hidden:{"rows":[2],"cols":[]}'])
  })

  it('falls back to replacing the hidden object when delegation fails', () => {
    const calls: string[] = []
    const commandCalls: string[] = []
    const commands: HiddenMutationCommands = {
      hideRow: (row) => { commandCalls.push(`hideRow:${row}`); return false },
      hideCol: () => false,
      showRow: () => false,
      showCol: () => false,
      showAll: () => false,
    }

    expect(applyHiddenChange({ rows: [], cols: [] }, { type: 'hideRow', row: 2 }, opsWithReplaceCalls(calls), undefined, commands)).toBe(true)

    expect(commandCalls).toEqual(['hideRow:2'])
    expect(calls).toEqual(['/hidden:{"rows":[2],"cols":[]}'])
  })
})

describe('coerceLegacyHidden', () => {
  it('returns undefined when no legacy hidden target survives', () => {
    expect(coerceLegacyHidden({ rows: [3], cols: ['C'] }, { rowCount: 2, colCount: 2 })).toBeUndefined()
    expect(coerceLegacyHidden(null)).toBeUndefined()
  })
})
