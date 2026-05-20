import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { DevToolsOverlay } from './DevToolsOverlay'
import { DevToolsOverlayDev } from './DevToolsOverlayDev'

describe('REC devtools overlay', () => {
  let host: HTMLDivElement
  let root: ReturnType<typeof createRoot>

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true
    host = document.createElement('div')
    document.body.append(host)
    root = createRoot(host)
  })

  afterEach(() => {
    act(() => root.unmount())
    host.remove()
  })

  it('renders a visible REC button in dev', () => {
    act(() => root.render(createElement(DevToolsOverlayDev)))

    expect(document.querySelector<HTMLButtonElement>('.rec-devtools')?.textContent).toBe('REC')
  })

  it('does not render the dev overlay outside development mode', () => {
    act(() => root.render(createElement(DevToolsOverlay)))

    expect(document.querySelector('.rec-devtools')).toBeNull()
    expect(document.querySelector('[data-interactive-os-devtools]')).toBeNull()
  })
})
