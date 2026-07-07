import { promptCondFormatRule } from './condFormatActions'
import type { CondActions } from './useCondFormat'
import type { Ask } from '../usePrompt'

interface Props extends CondActions {
  col: string | null
  hasRules: boolean
  ask: Ask
}

export function CondFmtButtons({ col, hasRules, addCondRule, clearCondRules, ask }: Props) {
  const onAdd = () => {
    void promptCondFormatRule({ col, ask, addCondRule })
  }
  return (
    <>
      <button type="button" onClick={onAdd} disabled={!col} title="조건부 서식 추가" aria-label="조건부 서식 추가">🎨조건</button>
      <button type="button" onClick={clearCondRules} disabled={!hasRules} title="조건부 서식 모두 해제" aria-label="조건부 서식 모두 해제">✕조건</button>
    </>
  )
}
