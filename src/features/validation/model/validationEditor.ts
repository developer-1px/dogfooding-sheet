import { normalizeValidationOptions } from '../../../entities/Sheet/schema'
import type { Rule } from '../hooks/useValidation'

export type ValidationEditorMode = 'none' | 'list' | 'checkbox' | 'mixed'

export interface ValidationEditorDraft {
  readonly mode: ValidationEditorMode
  readonly optionsText: string
}

const sameOptionalRule = (left: Rule | undefined, right: Rule | undefined): boolean => {
  if (left === undefined || right === undefined) return left === right
  if (left.type !== right.type) return false
  if (left.type === 'checkbox' || right.type === 'checkbox') return true
  return left.options.length === right.options.length
    && left.options.every((option, index) => option === right.options[index])
}

export function initialValidationEditorDraft(
  targetKeys: readonly string[],
  rules: Readonly<Record<string, Rule>>,
): ValidationEditorDraft {
  const firstRule = targetKeys[0] ? rules[targetKeys[0]] : undefined
  if (targetKeys.some((key) => !sameOptionalRule(firstRule, rules[key]))) {
    return { mode: 'mixed', optionsText: '' }
  }
  if (!firstRule) return { mode: 'none', optionsText: '' }
  if (firstRule.type === 'checkbox') return { mode: 'checkbox', optionsText: '' }
  return { mode: 'list', optionsText: firstRule.options.join('\n') }
}

export const validationOptionsFromText = (text: string): string[] =>
  normalizeValidationOptions(text.split(/\r?\n/))

export function validationEditorSummary(draft: ValidationEditorDraft): string {
  if (draft.mode === 'mixed') return '혼합'
  if (draft.mode === 'none') return '없음'
  if (draft.mode === 'checkbox') return '체크박스'
  return `드롭다운 ${validationOptionsFromText(draft.optionsText).length}개`
}
