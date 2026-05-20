import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createReproRecorder } from '@interactive-os/devtools/rec'

const hotkey = 'Ctrl/⌘+Shift+\\'

export function RecDevToolsOverlay() {
  const recorder = useMemo(() => createReproRecorder(), [])
  const [recording, setRecording] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const startTime = useRef(0)
  const interval = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopTimer = () => {
    if (interval.current) clearInterval(interval.current)
    interval.current = null
    setElapsed(0)
  }

  const toggle = useCallback(() => {
    if (recording) {
      const data = recorder.stop()
      setRecording(false)
      stopTimer()
      navigator.clipboard?.writeText(data.text).catch(() => {})
      return
    }

    recorder.start()
    setRecording(true)
    startTime.current = Date.now()
    interval.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime.current) / 1000))
    }, 1000)
  }, [recorder, recording])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === '\\') {
        e.preventDefault()
        toggle()
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => {
      window.removeEventListener('keydown', onKey, true)
      stopTimer()
      if (recorder.isActive) recorder.stop()
    }
  }, [recorder, toggle])

  const minutes = Math.floor(elapsed / 60)
  const seconds = String(elapsed % 60).padStart(2, '0')

  return (
    <button
      type="button"
      className={`rec-devtools${recording ? ' recording' : ''}`}
      onClick={toggle}
      title={`${hotkey}로 ${recording ? '녹화 중지' : '녹화 시작'}`}
      aria-pressed={recording}
    >
      <span className="rec-dot" />
      {recording ? `STOP ${minutes}:${seconds}` : 'REC'}
    </button>
  )
}
