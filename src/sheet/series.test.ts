import { describe, it, expect } from 'vitest'
import { extendSeries } from './series'

describe('extendSeries', () => {
  it('truncates when target is shorter', () => {
    expect(extendSeries(['a', 'b', 'c'], 2)).toEqual(['a', 'b'])
  })

  it('extrapolates arithmetic progression', () => {
    expect(extendSeries(['1', '2'], 5)).toEqual(['1', '2', '3', '4', '5'])
  })

  it('extrapolates with step 5', () => {
    expect(extendSeries(['10', '15', '20'], 5)).toEqual(['10', '15', '20', '25', '30'])
  })

  it('single number repeats with step 0', () => {
    expect(extendSeries(['7'], 4)).toEqual(['7', '7', '7', '7'])
  })

  it('non-uniform numbers fall back to cyclic repeat', () => {
    expect(extendSeries(['1', '3', '6'], 6)).toEqual(['1', '3', '6', '1', '3', '6'])
  })

  it('text values cycle', () => {
    expect(extendSeries(['Mon', 'Tue'], 5)).toEqual(['Mon', 'Tue', 'Mon', 'Tue', 'Mon'])
  })

  it('empty source produces empty cells', () => {
    expect(extendSeries([], 3)).toEqual(['', '', ''])
  })
})
