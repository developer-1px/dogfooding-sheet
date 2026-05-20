import { describe, expect, it } from 'vitest'
import { addValue, applyPatch, removeValue, replaceValue, type Patch } from './dictOps'

describe('dictOps mutation adapter', () => {
  it('applies non-empty patches and skips empty patches', () => {
    const calls: unknown[] = []
    const ops = { patch: (patch: never) => { calls.push(patch) } }
    const patch: Patch = [{ op: 'replace', path: '/cells', value: { A1: 'x' } }]

    applyPatch(ops, [])
    applyPatch(ops, patch)

    expect(calls).toEqual([patch])
  })

  it('adapts string paths for add, replace, and remove operations', () => {
    const calls: unknown[] = []
    const ops = {
      add: (path: never, value: never) => { calls.push(['add', path, value]) },
      replace: (path: never, value: never) => { calls.push(['replace', path, value]) },
      remove: (path: never) => { calls.push(['remove', path]) },
    }

    addValue(ops, '/formats/A1', 'currency')
    replaceValue(ops, '/formats/A1', 'plain')
    removeValue(ops, '/formats/A1')

    expect(calls).toEqual([
      ['add', '/formats/A1', 'currency'],
      ['replace', '/formats/A1', 'plain'],
      ['remove', '/formats/A1'],
    ])
  })
})
