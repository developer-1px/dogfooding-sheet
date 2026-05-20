import { describe, expect, it } from 'vitest'
import type { JSONOps } from 'zod-crud'
import { addValue, applyPatch, removeValue, replaceValue, upsertKey, upsertKeys, type Patch } from './dictOps'

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

  it('escapes record keys before using them as JSON Pointer path segments', () => {
    const calls: unknown[] = []
    const ops = {
      add: (path: never, value: never) => { calls.push(['add', path, value]) },
      replace: (path: never, value: never) => { calls.push(['replace', path, value]) },
      remove: (path: never) => { calls.push(['remove', path]) },
      patch: (patch: never) => { calls.push(['patch', patch]) },
    }
    const typedOps = ops as unknown as JSONOps<{ records: Record<string, string> }>

    upsertKey(typedOps, '/records', {}, 'a/b~c', 'new')
    upsertKey(typedOps, '/records', { 'a/b~c': 'old' }, 'a/b~c', 'next')
    upsertKey(typedOps, '/records', { 'a/b~c': 'old' }, 'a/b~c', undefined)
    upsertKeys(typedOps, '/records', { 'a/b~c': 'old' }, [['a/b~c', 'next']])

    expect(calls).toEqual([
      ['add', '/records/a~1b~0c', 'new'],
      ['replace', '/records/a~1b~0c', 'next'],
      ['remove', '/records/a~1b~0c'],
      ['patch', [{ op: 'replace', path: '/records/a~1b~0c', value: 'next' }]],
    ])
  })

  it('coalesces duplicate batch entries with the latest value winning', () => {
    const calls: unknown[] = []
    const ops = {
      patch: (patch: never) => { calls.push(['patch', patch]) },
    }
    const typedOps = ops as unknown as JSONOps<{ records: Record<string, string> }>

    upsertKeys(typedOps, '/records', { A: 'old', B: 'old' }, [
      ['A', 'first'],
      ['A', 'last'],
      ['B', undefined],
      ['B', 'kept'],
    ])

    expect(calls).toEqual([
      ['patch', [
        { op: 'replace', path: '/records/A', value: 'last' },
        { op: 'replace', path: '/records/B', value: 'kept' },
      ]],
    ])
  })
})
