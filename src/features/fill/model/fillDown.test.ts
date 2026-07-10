import { describe, it, expect } from 'vitest'
import { fillDown, fillRight } from './fillDown'

describe('fillDown', () => {
  it('delegates top-row source and full selection target', () => {
    const calls: unknown[] = []
    expect(fillDown(['r0-A', 'r0-B', 'r1-A', 'r1-B', 'r2-A', 'r2-B'], (source, target) => {
      calls.push([source, target])
      return true
    })).toBe(true)
    expect(calls).toEqual([[
      { rMin: 0, rMax: 0, cMin: 0, cMax: 1 },
      { rMin: 0, rMax: 2, cMin: 0, cMax: 1 },
    ]])
  })

  it('no-op for single-cell selection', () => {
    expect(fillDown(['r0-A'], () => true)).toBe(false)
  })

  it('fillRight delegates left-column source and full selection target', () => {
    const calls: unknown[] = []
    expect(fillRight(['r0-A', 'r0-B', 'r0-C', 'r1-A', 'r1-B', 'r1-C'], (source, target) => {
      calls.push([source, target])
      return true
    })).toBe(true)
    expect(calls).toEqual([[
      { rMin: 0, rMax: 1, cMin: 0, cMax: 0 },
      { rMin: 0, rMax: 1, cMin: 0, cMax: 2 },
    ]])
  })

  it('rejects non-rectangular selections', () => {
    expect(fillDown(['r0-A', 'r1-B'], () => true)).toBe(false)
    expect(fillRight(['r0-A', 'r1-B'], () => true)).toBe(false)
  })

  it('reports delegated failures', () => {
    expect(fillDown(['r0-A', 'r1-A'], () => false)).toBe(false)
    expect(fillRight(['r0-A', 'r0-B'], () => false)).toBe(false)
  })
})
