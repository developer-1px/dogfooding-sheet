import { promptCondFormatRule } from './condFormatActions'
import type { CondActions } from './useCondFormat'
import type { Ask } from '../usePrompt'

interface Props extends CondActions {
  col: string | null
  ask: Ask
}

export function CondFmtButtons({ col, addCondRule, clearCondRules, ask }: Props) {
  const onAdd = () => {
    void promptCondFormatRule({ col, ask, addCondRule })
  }
  return (
    <>
      <button onClick={onAdd} title="조건부 서식" aria-label="조건부 서식 추가">🎨조건</button>
      <button onClick={clearCondRules} title="조건부 서식 모두 해제" aria-label="조건부 서식 모두 해제">✕조건</button>
    </>
  )
}
