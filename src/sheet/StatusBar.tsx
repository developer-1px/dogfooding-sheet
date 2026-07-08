import { statusBarViewModel, type StatusBarModelProps } from './statusBarModel'
import type { SheetPersistenceState } from './sheetPersistence'

type Props = StatusBarModelProps & {
  persistence?: SheetPersistenceState
}

const fmt = (n: number) => Math.round(n * 1e6) / 1e6
interface PersistencePresentation {
  text: string
  detail?: string
}

const persistencePresentation = (state?: SheetPersistenceState): PersistencePresentation | null => {
  if (!state) return null
  if (state.status === 'error') {
    return {
      text: '저장 실패',
      detail: state.error ? `저장 실패: ${state.error}` : undefined,
    }
  }
  if (state.status === 'saving') return { text: '저장 중' }
  if (state.status === 'pending' || state.dirty) return { text: '저장 대기' }
  return {
    text: '저장됨',
    detail: state.savedAt ? `마지막 저장: ${state.savedAt}` : undefined,
  }
}
const statusRegionProps = {
  role: 'status',
  'aria-label': '상태 표시줄',
  'aria-live': 'polite',
  'aria-atomic': 'true',
} as const

export function StatusBar(props: Props) {
  const model = statusBarViewModel(props)
  const saved = persistencePresentation(props.persistence)
  const saveStatus = saved && (
    <span className="persistence-status" title={saved.detail} aria-label={saved.detail}>{saved.text}</span>
  )
  if (!model.showDetails) {
    return (
      <footer className="status-bar" {...statusRegionProps}>
        <span>{model.summary}</span>
        {saveStatus}
      </footer>
    )
  }

  return (
    <footer className="status-bar" {...statusRegionProps}>
      <span>{model.summary}</span>
      {saveStatus}
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
