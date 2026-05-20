import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DevToolsOverlay } from './DevToolsOverlay'
import { DevToolsOverlayDev } from './DevToolsOverlayDev'

const recorderMock = vi.hoisted(() => {
  const state = { active: false }
  const start = vi.fn(() => { state.active = true })
  const stop = vi.fn(() => {
    state.active = false
    return { text: 'recorded' }
  })
  const createReproRecorder = vi.fn(() => ({
    start,
    stop,
    get isActive() {
      return state.active
    },
  }))
  return {
    createReproRecorder,
    start,
    stop,
    reset: () => {
      state.active = false
      createReproRecorder.mockClear()
      start.mockClear()
      stop.mockClear()
    },
  }
})

vi.mock('@interactive-os/devtools/rec', () => ({
  createReproRecorder: recorderMock.createReproRecorder,
}))

describe('REC devtools overlay', () => {
  let host: HTMLDivElement
  let root: ReturnType<typeof createRoot>

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true
    recorderMock.reset()
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

  it('keeps the recorder active after starting', () => {
    act(() => root.render(createElement(DevToolsOverlayDev)))

    const button = document.querySelector<HTMLButtonElement>('.rec-devtools')
    expect(button).not.toBeNull()
    act(() => button!.click())

    expect(recorderMock.start).toHaveBeenCalledTimes(1)
    expect(recorderMock.stop).toHaveBeenCalledTimes(0)
    expect(document.querySelector<HTMLButtonElement>('.rec-devtools')?.getAttribute('aria-pressed')).toBe('true')
  })

  it('stops an active recorder when the overlay unmounts', () => {
    act(() => root.render(createElement(DevToolsOverlayDev)))

    const button = document.querySelector<HTMLButtonElement>('.rec-devtools')
    expect(button).not.toBeNull()
    act(() => button!.click())
    act(() => root.render(null))

    expect(recorderMock.stop).toHaveBeenCalledTimes(1)
  })

  it('does not render the dev overlay outside development mode', () => {
    act(() => root.render(createElement(DevToolsOverlay)))

    expect(document.querySelector('.rec-devtools')).toBeNull()
    expect(document.querySelector('[data-interactive-os-devtools]')).toBeNull()
  })
})
