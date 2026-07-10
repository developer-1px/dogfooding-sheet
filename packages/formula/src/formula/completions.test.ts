import { describe, expect, it } from 'vitest'
import { applyFormulaFunctionCompletion, formulaFunctionCompletions } from './completions'

describe('formula function completions', () => {
  it('suggests supported functions for a case-insensitive prefix', () => {
    const completions = formulaFunctionCompletions('=su')

    expect(completions[0]).toEqual({
      name: 'SUM',
      from: 1,
      to: 3,
      insertText: 'SUM(',
    })
    expect(formulaFunctionCompletions('=sump')[0]?.name).toBe('SUMPRODUCT')
  })

  it('completes the function token at a nested caret', () => {
    const formula = '=IF(A1, aver + 1)'
    const caretOffset = formula.indexOf('aver') + 4
    const [completion] = formulaFunctionCompletions(formula, caretOffset)

    expect(completion?.name).toBe('AVERAGE')
    expect(applyFormulaFunctionCompletion(formula, completion!)).toEqual({
      formula: '=IF(A1, AVERAGE( + 1)',
      caretOffset: 16,
    })
  })

  it('replaces the full identifier and reuses an existing opening parenthesis', () => {
    const formula = '=SUUM(A1)'
    const [completion] = formulaFunctionCompletions(formula, 3)

    expect(completion).toEqual({
      name: 'SUM',
      from: 1,
      to: 5,
      insertText: 'SUM',
    })
    expect(applyFormulaFunctionCompletion(formula, completion!)).toEqual({
      formula: '=SUM(A1)',
      caretOffset: 4,
    })
  })

  it('does not suggest outside formulas, inside strings, or after a completed function', () => {
    expect(formulaFunctionCompletions('su')).toEqual([])
    expect(formulaFunctionCompletions('="sum')).toEqual([])
    expect(formulaFunctionCompletions('=SUM(')).toEqual([])
  })

  it('caps stable results without exposing the mutable function registry', () => {
    const first = formulaFunctionCompletions('=s', undefined, 5)
    const second = formulaFunctionCompletions('=s', undefined, 5)

    expect(first).toHaveLength(5)
    expect(second).toEqual(first)
    expect(first).not.toBe(second)
  })
})
