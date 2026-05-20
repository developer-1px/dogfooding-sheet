import type { Ask } from '../usePrompt'
import type { CondActions, CondOp, CondRule } from './useCondFormat'
import { isSafeCellText } from '../cellValue'

export type CondFormatActionResult = 'applied' | 'cancelled' | 'invalid' | 'no-column'

const COND_SPEC_RE = /^\s*(>|<|=|!=|contains)\s*(.+?)\s+(#[0-9a-fA-F]{3,8})\s*$/

export function parseCondFormatSpec(col: string, spec: string): CondRule | null {
  const match = COND_SPEC_RE.exec(spec)
  if (!match) return null
  const op = match[1] as CondOp
  const value = match[2].trim()
  if (value === '' || !isSafeCellText(value)) return null
  if ((op === '>' || op === '<') && (!Number.isFinite(Number(value)) || value.startsWith('='))) return null
  return {
    col,
    op,
    value,
    color: match[3],
  }
}

export async function promptCondFormatRule({
  col,
  ask,
  addCondRule,
}: {
  col: string | null
  ask: Ask
  addCondRule: CondActions['addCondRule']
}): Promise<CondFormatActionResult> {
  if (!col) return 'no-column'

  let spec: string | null
  try {
    spec = await ask({
      label: `${col}열 조건부 서식 (예: >100 #ffeb3b 또는 contains foo #c8e6c9)`,
      initial: '>0 #fff59d',
      submitLabel: '추가',
    })
  } catch {
    return 'cancelled'
  }
  if (!spec) return 'cancelled'

  const rule = parseCondFormatSpec(col, spec)
  if (!rule) return 'invalid'
  addCondRule(rule)
  return 'applied'
}
