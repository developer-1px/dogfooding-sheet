import { describe, expect, it } from 'vitest'
import { formulaReferenceDecorationsFor } from './formulaReferenceDecorations'

describe('formulaReferenceDecorationsFor', () => {
  it('groups range cells under one formula reference decoration', () => {
    const refs = formulaReferenceDecorationsFor('r0-A', '=SUM(B1:B2)+A1', {
      rowCount: 5,
      colLetters: ['A', 'B', 'C'],
    })

    expect(refs.highlightedIds).toEqual(['r0-B', 'r1-B', 'r0-A'])
    expect(refs.byId.get('r0-B')).toEqual({ index: 0, token: 'B1:B2', className: 'formula-ref formula-ref-0' })
    expect(refs.byId.get('r1-B')).toEqual({ index: 0, token: 'B1:B2', className: 'formula-ref formula-ref-0' })
    expect(refs.byId.get('r0-A')).toEqual({ index: 1, token: 'A1', className: 'formula-ref formula-ref-1' })
  })

  it('ignores non-formulas and out-of-bounds references', () => {
    expect(formulaReferenceDecorationsFor(null, '=A1', { rowCount: 1, colLetters: ['A'] }).highlightedIds).toEqual([])
    expect(formulaReferenceDecorationsFor('r0-A', 'A1', { rowCount: 1, colLetters: ['A'] }).highlightedIds).toEqual([])
    expect(formulaReferenceDecorationsFor('r0-A', '=Z99', { rowCount: 1, colLetters: ['A'] }).highlightedIds).toEqual([])
  })
})
