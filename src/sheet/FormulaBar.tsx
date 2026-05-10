import { useEffect, useState, type ReactNode } from 'react'

interface Props {
  addr: string | null
  value: string
  onCommit: (v: string) => void
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
  extra?: ReactNode
}

export function FormulaBar({ addr, value, onCommit, onUndo, onRedo, canUndo, canRedo, extra }: Props) {
  const [draft, setDraft] = useState(value)
  useEffect(() => { setDraft(value) }, [value, addr])

  return (
    <header className="sheet-toolbar">
      <strong>Sheet</strong>
      <span className="addr">{addr ?? '—'}</span>
      <input
        className="formula"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => onCommit(draft)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.currentTarget.blur() }
          else if (e.key === 'Escape') { setDraft(value); e.currentTarget.blur() }
        }}
        placeholder="값 또는 =A1+B1"
        disabled={!addr}
      />
      <button onClick={onUndo} disabled={!canUndo}>Undo</button>
      <button onClick={onRedo} disabled={!canRedo}>Redo</button>
      {extra}
    </header>
  )
}
