interface Props {
  col: string | null
  addCondRule: (r: { col: string; op: '>' | '<' | '=' | '!=' | 'contains'; value: string; color: string }) => void
  clearCondRules: () => void
}

export function CondFmtButtons({ col, addCondRule, clearCondRules }: Props) {
  const onAdd = () => {
    if (!col) return
    let spec: string | null = null
    try { spec = window.prompt(`${col}열 조건부 서식 (예: >100 #ffeb3b 또는 contains foo #c8e6c9)`, '>0 #fff59d') } catch { return }
    if (!spec) return
    const m = /^\s*(>|<|=|!=|contains)\s*(.+?)\s+(#[0-9a-fA-F]{3,8})\s*$/.exec(spec)
    if (m) addCondRule({ col, op: m[1] as never, value: m[2], color: m[3] })
  }
  return (
    <>
      <button onClick={onAdd} title="조건부 서식">🎨조건</button>
      <button onClick={clearCondRules} title="조건부 서식 모두 해제">✕조건</button>
    </>
  )
}
