import type { Ask } from '../usePrompt'
import type { CondActions, CondOp, CondRule } from './useCondFormat'

export type CondFormatActionResult = 'applied' | 'cancelled' | 'invalid' | 'no-column'

const COND_SPEC_RE = /^\s*(>|<|=|!=|contains)\s*(.+?)\s+(#[0-9a-fA-F]{3,8})\s*$/

export function parseCondFormatSpec(col: string, spec: string): CondRule | null {
  const match = COND_SPEC_RE.exec(spec)
  if (!match) return null
  if ((match[1] === '>' || match[1] === '<') && match[2].trimStart().startsWith('=')) return null
  return {
    col,
    op: match[1] as CondOp,
    value: match[2],
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

  const spec = await ask({
    label: `${col}열 조건부 서식 (예: >100 #ffeb3b 또는 contains foo #c8e6c9)`,
    initial: '>0 #fff59d',
    submitLabel: '추가',
  })
  if (!spec) return 'cancelled'

  const rule = parseCondFormatSpec(col, spec)
  if (!rule) return 'invalid'
  addCondRule(rule)
  return 'applied'
}
