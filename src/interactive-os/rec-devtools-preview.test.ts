import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { DevToolsOverlay } from './DevToolsOverlay'

describe('REC devtools overlay', () => {
  const originalDev = import.meta.env.DEV
  let host: HTMLDivElement
  let root: ReturnType<typeof createRoot>

  beforeEach(() => {
    import.meta.env.DEV = true
    host = document.createElement('div')
    document.body.append(host)
    root = createRoot(host)
  })

  afterEach(() => {
    act(() => root.unmount())
    host.remove()
    import.meta.env.DEV = originalDev
  })

  it('renders a visible REC button in dev', () => {
    act(() => root.render(createElement(DevToolsOverlay)))

    expect(document.querySelector<HTMLButtonElement>('.rec-devtools')?.textContent).toBe('REC')
  })
})

