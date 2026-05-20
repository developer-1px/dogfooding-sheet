import { statusBarViewModel, type StatusBarModelProps } from './statusBarModel'

type Props = StatusBarModelProps

const fmt = (n: number) => Math.round(n * 1e6) / 1e6

export function StatusBar(props: Props) {
  const model = statusBarViewModel(props)
  if (!model.showDetails) {
    return <footer className="status-bar" role="status" aria-live="polite"><span>{model.summary}</span></footer>
  }

  return (
    <footer className="status-bar" role="status" aria-live="polite">
      <span>{model.summary}</span>
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
