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

  it('Korean weekdays continue the cycle', () => {
    expect(extendSeries(['월', '화'], 7)).toEqual(['월', '화', '수', '목', '금', '토', '일'])
  })
  it('Korean month names continue the cycle', () => {
    expect(extendSeries(['1월', '2월'], 4)).toEqual(['1월', '2월', '3월', '4월'])
  })
  it('weekday/month names continue the cycle', () => {
    expect(extendSeries(['Mon', 'Tue'], 5)).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri'])
    expect(extendSeries(['Jan', 'Feb', 'Mar'], 5)).toEqual(['Jan', 'Feb', 'Mar', 'Apr', 'May'])
  })
  it('arbitrary text values cycle', () => {
    expect(extendSeries(['x', 'y'], 5)).toEqual(['x', 'y', 'x', 'y', 'x'])
  })

  it('extends ISO date series by day step', () => {
    expect(extendSeries(['2026-01-01', '2026-01-02'], 4)).toEqual(['2026-01-01', '2026-01-02', '2026-01-03', '2026-01-04'])
    expect(extendSeries(['2026-01-31'], 3)).toEqual(['2026-01-31', '2026-02-01', '2026-02-02'])
  })
  it('empty source produces empty cells', () => {
    expect(extendSeries([], 3)).toEqual(['', '', ''])
  })
})
