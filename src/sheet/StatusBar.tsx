import { statusBarViewModel, type StatusBarModelProps } from './statusBarModel'
import type { SheetPersistenceState } from './sheetPersistence'

type Props = StatusBarModelProps & {
  persistence?: SheetPersistenceState
}

const fmt = (n: number) => Math.round(n * 1e6) / 1e6
const persistenceText = (state?: SheetPersistenceState): string | null => {
  if (!state) return null
  if (state.status === 'error') return '저장 실패'
  if (state.status === 'saving') return '저장 중'
  if (state.status === 'pending' || state.dirty) return '저장 대기'
  return '저장됨'
}
const statusRegionProps = {
  role: 'status',
  'aria-label': '상태 표시줄',
  'aria-live': 'polite',
  'aria-atomic': 'true',
} as const

export function StatusBar(props: Props) {
  const model = statusBarViewModel(props)
  const saved = persistenceText(props.persistence)
  if (!model.showDetails) {
    return (
      <footer className="status-bar" {...statusRegionProps}>
        <span>{model.summary}</span>
        {saved && <span>{saved}</span>}
      </footer>
    )
  }

  return (
    <footer className="status-bar" {...statusRegionProps}>
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
