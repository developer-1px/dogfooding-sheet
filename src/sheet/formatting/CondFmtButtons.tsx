import { promptCondFormatRule } from './condFormatActions'
import type { CondActions } from './useCondFormat'
import type { Ask } from '../usePrompt'
import { stopToolbarActivationKeyDown } from '../toolbarKeyEvents'

interface Props extends CondActions {
  col: string | null
  ruleCount: number
  ask: Ask
}

export function CondFmtButtons({ col, ruleCount, addCondRule, clearCondRules, ask }: Props) {
  const onAdd = () => {
    void promptCondFormatRule({ col, ask, addCondRule })
  }
  const hasRules = ruleCount > 0
  const addLabel = col ? `${col}열 조건부 서식 추가` : '조건부 서식을 추가할 열 없음'
  const clearLabel = hasRules ? `조건부 서식 ${ruleCount}개 모두 해제` : '해제할 조건부 서식 없음'

  return (
    <>
      <button type="button" onKeyDown={stopToolbarActivationKeyDown} onClick={onAdd} disabled={!col} title={addLabel} aria-label={addLabel}>🎨조건</button>
      <button type="button" onKeyDown={stopToolbarActivationKeyDown} onClick={clearCondRules} disabled={!hasRules} title={clearLabel} aria-label={clearLabel}>✕조건</button>
    </>
  )
}
