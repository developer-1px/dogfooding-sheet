import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
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
})
