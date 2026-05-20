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
})
