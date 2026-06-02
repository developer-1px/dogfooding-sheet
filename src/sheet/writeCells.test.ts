import { describe, expect, it } from 'vitest'
import type { SheetOps } from './schema'
import { MAX_CELL_TEXT_LENGTH } from './cellValue'
import { writeCellsBatch, writeSingleCell } from './writeCells'

const oversized = 'x'.repeat(MAX_CELL_TEXT_LENGTH + 1)

const recordingOps = () => {
  const calls: unknown[] = []
  return {
    calls,
    ops: {
      add: (path: never, value: never) => { calls.push(['add', path, value]) },
      replace: (path: never, value: never) => { calls.push(['replace', path, value]) },
      remove: (path: never) => { calls.push(['remove', path]) },
      patch: (patch: never) => { calls.push(['patch', patch]) },
    } as unknown as SheetOps,
  }
}

describe('cell write adapters', () => {
  it('applies single cell writes and rejects oversized values without deleting existing cells', () => {
    const { ops, calls } = recordingOps()

    writeSingleCell(ops, {}, 'A1', 'ok')
    writeSingleCell(ops, { B1: 'keep' }, 'B1', oversized)
    writeSingleCell(ops, { C1: 'clear' }, 'C1', '')

    expect(calls).toEqual([
      ['add', '/cells/A1', 'ok'],
      ['remove', '/cells/C1'],
    ])
  })

  it('filters oversized values out of batch writes', () => {
    const { ops, calls } = recordingOps()

    writeCellsBatch(ops, { A1: 'old', D1: 'clear' }, [
      ['A1', 'new'],
      ['B1', oversized],
      ['C1', 'ok'],
      ['D1', ''],
    ])

    expect(calls).toEqual([
      ['patch', [
        { op: 'replace', path: '/cells/A1', value: 'new' },
        { op: 'add', path: '/cells/C1', value: 'ok' },
        { op: 'remove', path: '/cells/D1' },
      ]],
    ])
  })

  it('ignores invalid and out-of-bounds cell keys when bounds are provided', () => {
    const { ops, calls } = recordingOps()

    writeSingleCell(ops, {}, 'C1', 'outside', { rowCount: 2, colCount: 2 })
    writeSingleCell(ops, {}, 'bad', 'invalid', { rowCount: 2, colCount: 2 })
    writeSingleCell(ops, {}, 'B2', 'inside', { rowCount: 2, colCount: 2 })
    writeCellsBatch(ops, {}, [
      ['A1', 'ok'],
      ['A3', 'outside'],
      ['bad', 'invalid'],
    ], { rowCount: 2, colCount: 2 })

    expect(calls).toEqual([
      ['add', '/cells/B2', 'inside'],
      ['patch', [{ op: 'add', path: '/cells/A1', value: 'ok' }]],
    ])
  })

  it('coalesces duplicate batch writes before building the patch', () => {
    const { ops, calls } = recordingOps()

    writeCellsBatch(ops, { B1: 'old', C1: 'old' }, [
      ['A1', 'first'],
      ['A1', 'last'],
      ['B1', ''],
      ['B1', 'kept'],
      ['C1', 'new'],
      ['C1', ''],
    ])

    expect(calls).toEqual([
      ['patch', [
        { op: 'add', path: '/cells/A1', value: 'last' },
        { op: 'replace', path: '/cells/B1', value: 'kept' },
        { op: 'remove', path: '/cells/C1' },
      ]],
    ])
  })

  it('delegates normalized sparse cell intents before local patch fallback', () => {
    const { ops, calls } = recordingOps()
    const edited: Array<Array<[string, string | undefined]>> = []
    const editEntries = (entries: Array<[string, string | undefined]>) => {
      edited.push(entries)
      return true
    }

    writeSingleCell(ops, { A1: 'old' }, 'A1', 'next', undefined, editEntries)
    writeCellsBatch(ops, { B1: 'old', C1: 'drop' }, [
      ['B1', 'new'],
      ['C1', ''],
      ['D1', 'added'],
    ], undefined, editEntries)

    expect(edited).toEqual([
      [['A1', 'next']],
      [['B1', 'new'], ['C1', undefined], ['D1', 'added']],
    ])
    expect(calls).toEqual([])
  })
})
