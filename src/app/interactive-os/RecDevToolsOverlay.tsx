import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createReproRecorder } from '@interactive-os/devtools/rec'

const hotkey = 'Ctrl/⌘+Shift+\\'
const hotkeyShortcuts = ['Control+Shift+\\', 'Meta+Shift+\\'].join(' ')

export function RecDevToolsOverlay() {
  const recorder = useMemo(() => createReproRecorder(), [])
  const [recording, setRecording] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const startTime = useRef(0)
  const interval = useRef<ReturnType<typeof setInterval> | null>(null)
  const recordingRef = useRef(false)

  const clearTimer = useCallback(() => {
    if (interval.current) clearInterval(interval.current)
    interval.current = null
  }, [])

  const toggle = useCallback(() => {
    if (recordingRef.current) {
      const data = recorder.stop()
      recordingRef.current = false
      setRecording(false)
      clearTimer()
      setElapsed(0)
      navigator.clipboard?.writeText(data.text).catch(() => {})
      return
    }

    recorder.start()
    recordingRef.current = true
    setRecording(true)
    clearTimer()
    setElapsed(0)
    startTime.current = Date.now()
    interval.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime.current) / 1000))
    }, 1000)
  }, [clearTimer, recorder])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === '\\') {
        e.preventDefault()
        toggle()
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [toggle])

  useEffect(() => () => {
    clearTimer()
    if (recordingRef.current || recorder.isActive) {
      recorder.stop()
      recordingRef.current = false
    }
  }, [clearTimer, recorder])

  const minutes = Math.floor(elapsed / 60)
  const seconds = String(elapsed % 60).padStart(2, '0')
  const elapsedLabel = `${minutes}:${seconds}`
  const actionLabel = recording ? `REC 녹화 중지, 경과 시간 ${elapsedLabel}` : 'REC 녹화 시작'

  return (
    <button
      type="button"
      className={`rec-devtools${recording ? ' recording' : ''}`}
      onClick={toggle}
      title={`${hotkey}로 ${recording ? '녹화 중지' : '녹화 시작'}`}
      aria-label={actionLabel}
      aria-keyshortcuts={hotkeyShortcuts}
      aria-pressed={recording}
    >
      <span className="rec-dot" aria-hidden="true" />
      <span className="rec-label">{recording ? `STOP ${elapsedLabel}` : 'REC'}</span>
    </button>
  )
}
