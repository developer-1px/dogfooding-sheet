import { useEffect, useState } from 'react'

type DevToolsOverlayDevComponent = typeof import('./DevToolsOverlayDev').DevToolsOverlayDev
const loadDevToolsOverlayDev = import.meta.env.MODE === 'development'
  ? () => import('./DevToolsOverlayDev')
  : null

export function DevToolsOverlay() {
  const [DevToolsOverlayDev, setDevToolsOverlayDev] = useState<DevToolsOverlayDevComponent | null>(null)

  useEffect(() => {
    if (!loadDevToolsOverlayDev) return
    let cancelled = false
    loadDevToolsOverlayDev()
      .then((module) => {
        if (!cancelled) setDevToolsOverlayDev(() => module.DevToolsOverlayDev)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  if (!loadDevToolsOverlayDev || !DevToolsOverlayDev) return null
  return <DevToolsOverlayDev />
}
