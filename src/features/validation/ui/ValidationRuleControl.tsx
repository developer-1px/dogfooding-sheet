import { useState } from 'react'
import type { Rule, ValidationActions } from '../hooks/useValidation'
import { initialValidationEditorDraft, validationEditorSummary } from '../model/validationEditor'
import { stopToolbarActivationKeyDown } from '../../../shared/ui/toolbarKeyEvents'
import { ValidationRuleDialog } from './ValidationRuleDialog'

interface Props extends ValidationActions {
  readonly targetLabel: string
  readonly targetKeys: readonly string[]
  readonly rules: Readonly<Record<string, Rule>>
}

export function ValidationRuleControl({ targetLabel, targetKeys, rules, ...actions }: Props) {
  const [open, setOpen] = useState(false)
  const hasTarget = targetKeys.length > 0
  const summary = validationEditorSummary(initialValidationEditorDraft(targetKeys, rules))
  const label = hasTarget
    ? `${targetLabel} 데이터 유효성 설정 (현재 ${summary})`
    : '데이터 유효성을 설정할 셀 없음'

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        onKeyDown={stopToolbarActivationKeyDown}
        disabled={!hasTarget}
        title={label}
        aria-label={label}
        aria-haspopup="dialog"
        aria-expanded={open}
      >유효성</button>
      <ValidationRuleDialog
        open={open}
        targetLabel={targetLabel}
        targetKeys={targetKeys}
        rules={rules}
        {...actions}
        onClose={() => setOpen(false)}
      />
    </>
  )
}
