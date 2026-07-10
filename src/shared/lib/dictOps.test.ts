import { describe, expect, it } from 'vitest'
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

    upsertKey(ops, '/records', {}, 'a/b~c', 'new')
    upsertKey(ops, '/records', { 'a/b~c': 'old' }, 'a/b~c', 'next')
    upsertKey(ops, '/records', { 'a/b~c': 'old' }, 'a/b~c', undefined)
    upsertKeys(ops, '/records', { 'a/b~c': 'old' }, [['a/b~c', 'next']])

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

    upsertKeys(ops, '/records', { A: 'old', B: 'old' }, [
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

  it('supports semantic equality for object values', () => {
    const calls: unknown[] = []
    const ops = {
      patch: (patch: never) => { calls.push(['patch', patch]) },
    }
    const equalByValue = (a: { value: string }, b: { value: string }) => a.value === b.value

    upsertKeys(ops, '/records', { A: { value: 'same' }, B: { value: 'old' } }, [
      ['A', { value: 'same' }],
      ['B', { value: 'new' }],
    ], equalByValue)

    expect(calls).toEqual([
      ['patch', [
        { op: 'replace', path: '/records/B', value: { value: 'new' } },
      ]],
    ])
  })

  it('delegates sparse entry intents before local patch fallback', () => {
    const calls: unknown[] = []
    const ops = {
      add: (path: never, value: never) => { calls.push(['add', path, value]) },
      replace: (path: never, value: never) => { calls.push(['replace', path, value]) },
      remove: (path: never) => { calls.push(['remove', path]) },
      patch: (patch: never) => { calls.push(['patch', patch]) },
    }
    const edited: unknown[] = []
    const commands = {
      editEntries: (entries: Array<[string, string | undefined]>) => { edited.push(entries); return true },
    }

    upsertKey(ops, '/records', {}, 'A', 'new', undefined, commands)
    upsertKeys(ops, '/records', { B: 'old', C: 'drop' }, [
      ['B', 'new'],
      ['C', undefined],
      ['D', 'added'],
    ], undefined, commands)

    expect(edited).toEqual([
      [['A', 'new']],
      [['B', 'new'], ['C', undefined], ['D', 'added']],
    ])
    expect(calls).toEqual([])
  })

  it('falls back to local patching when sparse entry delegation fails', () => {
    const calls: unknown[] = []
    const ops = {
      patch: (patch: never) => { calls.push(['patch', patch]) },
    }

    upsertKeys(ops, '/records', { A: 'old', B: 'drop' }, [
      ['A', 'new'],
      ['B', undefined],
      ['C', 'added'],
    ], undefined, {
      editEntries: () => false,
    })

    expect(calls).toEqual([
      ['patch', [
        { op: 'replace', path: '/records/A', value: 'new' },
        { op: 'remove', path: '/records/B' },
        { op: 'add', path: '/records/C', value: 'added' },
      ]],
    ])
  })
})
