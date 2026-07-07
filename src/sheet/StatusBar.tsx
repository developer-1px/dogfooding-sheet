import { statusBarViewModel, type StatusBarModelProps } from './statusBarModel'
import type { SheetPersistenceState } from './useSheetDocument'

type Props = StatusBarModelProps & {
  persistence?: SheetPersistenceState
}

const fmt = (n: number) => Math.round(n * 1e6) / 1e6
const persistenceText = (state?: SheetPersistenceState): string | null => {
  if (!state) return null
  if (state.status === 'error') return '저장 실패'
  if (state.status === 'saving' || state.dirty) return '저장 중'
  return '저장됨'
}

export function StatusBar(props: Props) {
  const model = statusBarViewModel(props)
  const saved = persistenceText(props.persistence)
  if (!model.showDetails) {
    return (
      <footer className="status-bar" role="status" aria-live="polite" aria-atomic="true">
        <span>{model.summary}</span>
        {saved && <span>{saved}</span>}
      </footer>
    )
  }

  return (
    <footer className="status-bar" role="status" aria-live="polite" aria-atomic="true">
      <span>{model.summary}</span>
      {saved && <span>{saved}</span>}
      <span>COUNTA: <b>{model.nonEmpty}</b></span>
      {model.numeric && (
        <>
          <span>SUM: <b>{fmt(model.numeric.sum)}</b></span>
          <span>AVG: <b>{fmt(model.numeric.avg)}</b></span>
          <span>MIN: <b>{fmt(model.numeric.min)}</b></span>
          <span>MAX: <b>{fmt(model.numeric.max)}</b></span>
          <span>COUNT: <b>{model.numeric.count}</b></span>
          <span>MEDIAN: <b>{fmt(model.numeric.median)}</b></span>
        </>
      )}
    </footer>
  )
}
