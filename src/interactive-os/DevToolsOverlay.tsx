import { interactiveOsPackages } from './packageCatalog'
import { RecDevToolsOverlay } from './RecDevToolsOverlay'
import './devtools.css'

export function DevToolsOverlay() {
  if (!import.meta.env.DEV) return null
  return (
    <>
      <span
        hidden
        data-interactive-os-packages={interactiveOsPackages.length}
        data-interactive-os-devtools="linked"
      />
      <RecDevToolsOverlay />
    </>
  )
}
