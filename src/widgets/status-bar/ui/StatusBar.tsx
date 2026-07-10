import { statusBarViewModel, type StatusBarModelProps } from '../model/statusBarModel'
import type { SheetPersistenceState } from '../../../features/sheet-document/model/sheetPersistence'

type Props = StatusBarModelProps & {
  persistence?: SheetPersistenceState
}

const fmt = (n: number) => Math.round(n * 1e6) / 1e6
const aggregateTitles = {
  nonEmpty: '선택 영역의 비어 있지 않은 셀 수',
  sum: '선택 영역 숫자 값 합계',
  avg: '선택 영역 숫자 값 평균',
  min: '선택 영역 숫자 값 최솟값',
  max: '선택 영역 숫자 값 최댓값',
  count: '선택 영역 숫자 값 개수',
  median: '선택 영역 숫자 값 중앙값',
} as const
interface PersistencePresentation {
  text: string
  detail?: string
  busy?: boolean
  alert?: boolean
}

const persistencePresentation = (state?: SheetPersistenceState): PersistencePresentation | null => {
  if (!state) return null
  if (state.status === 'error') {
    return {
      text: '저장 실패',
      detail: state.error ? `저장 실패: ${state.error}` : '저장 실패',
      alert: true,
    }
  }
  if (state.status === 'saving') return { text: '저장 중', detail: '변경 사항 저장 중', busy: true }
  if (state.status === 'pending' || state.dirty) return { text: '저장 대기', detail: '자동 저장 대기 중' }
  return {
    text: '저장됨',
    detail: state.savedAt ? `마지막 저장: ${state.savedAt}` : '저장됨',
  }
}
const statusRegionProps = {
  role: 'status',
  'aria-label': '상태 표시줄',
  'aria-live': 'polite',
  'aria-atomic': 'true',
} as const

function AggregateMetric({ code, title, value }: { code: string; title: string; value: number }) {
  return <span title={title} aria-label={`${title}: ${value}`}>{code}: <b>{value}</b></span>
}

export function StatusBar(props: Props) {
  const model = statusBarViewModel(props)
  const saved = persistencePresentation(props.persistence)
  const saveStatus = saved && (
    <span className="persistence-status" role={saved.alert ? 'alert' : undefined} title={saved.detail} aria-label={saved.detail} aria-busy={saved.busy || undefined}>{saved.text}</span>
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
      <AggregateMetric code="COUNTA" title={aggregateTitles.nonEmpty} value={model.nonEmpty} />
      {model.numeric && (
        <>
          <AggregateMetric code="SUM" title={aggregateTitles.sum} value={fmt(model.numeric.sum)} />
          <AggregateMetric code="AVG" title={aggregateTitles.avg} value={fmt(model.numeric.avg)} />
          <AggregateMetric code="MIN" title={aggregateTitles.min} value={fmt(model.numeric.min)} />
          <AggregateMetric code="MAX" title={aggregateTitles.max} value={fmt(model.numeric.max)} />
          <AggregateMetric code="COUNT" title={aggregateTitles.count} value={model.numeric.count} />
          <AggregateMetric code="MEDIAN" title={aggregateTitles.median} value={fmt(model.numeric.median)} />
        </>
      )}
    </footer>
  )
}
