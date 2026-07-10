import { FORMULA_FUNCTION_NAMES } from './parse'

export interface FormulaFunctionCompletion {
  readonly name: string
  readonly from: number
  readonly to: number
  readonly insertText: string
}

export interface AppliedFormulaFunctionCompletion {
  readonly formula: string
  readonly caretOffset: number
}

const functionNames = [...FORMULA_FUNCTION_NAMES]
const identifierBeforeCaret = /[A-Z_][A-Z0-9_]*$/i
const identifierAfterCaret = /^[A-Z0-9_]*/i
const identifierContinuation = /[A-Z0-9_.$]/i

const isInsideString = (formula: string, caretOffset: number): boolean => {
  let inside = false
  for (let index = 1; index < caretOffset; index++) {
    if (formula[index] !== '"') continue
    if (inside && formula[index + 1] === '"') {
      index++
      continue
    }
    inside = !inside
  }
  return inside
}

const compareFunctionNames = (prefix: string) => (left: string, right: string): number => {
  if (left === right) return 0
  if (left === prefix) return -1
  if (right === prefix) return 1
  if (left.length !== right.length) return left.length - right.length
  return left < right ? -1 : left > right ? 1 : 0
}

export function formulaFunctionCompletions(
  formula: string,
  caretOffset = formula.length,
  limit = 8,
): FormulaFunctionCompletion[] {
  if (!formula.startsWith('=') || limit <= 0) return []
  const caret = Math.max(1, Math.min(Math.trunc(caretOffset), formula.length))
  if (isInsideString(formula, caret)) return []

  const beforeCaret = formula.slice(0, caret)
  const match = identifierBeforeCaret.exec(beforeCaret)
  if (!match) return []
  const from = caret - match[0].length
  if (from < 1 || identifierContinuation.test(formula[from - 1] ?? '')) return []

  const suffix = identifierAfterCaret.exec(formula.slice(caret))?.[0] ?? ''
  const to = caret + suffix.length
  const prefix = match[0].toUpperCase()
  if (FORMULA_FUNCTION_NAMES.has(prefix) && formula[to] === '(') return []

  const insertOpeningParenthesis = formula[to] !== '('
  return functionNames
    .filter((name) => name.startsWith(prefix))
    .sort(compareFunctionNames(prefix))
    .slice(0, Math.trunc(limit))
    .map((name) => ({
      name,
      from,
      to,
      insertText: `${name}${insertOpeningParenthesis ? '(' : ''}`,
    }))
}

export function applyFormulaFunctionCompletion(
  formula: string,
  completion: FormulaFunctionCompletion,
): AppliedFormulaFunctionCompletion {
  const nextFormula = `${formula.slice(0, completion.from)}${completion.insertText}${formula.slice(completion.to)}`
  return {
    formula: nextFormula,
    caretOffset: completion.from + completion.insertText.length,
  }
}
