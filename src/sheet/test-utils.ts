import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach } from 'vitest'

/** Dispatch a `keydown` on `window` with optional modifier keys. */
export const press = (
  key: string,
  mod: { ctrlKey?: boolean; metaKey?: boolean; shiftKey?: boolean; altKey?: boolean } = {},
): void => {
  window.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key, ...mod }))
}

/** All grid cells currently rendered in the DOM, in document order. */
export const cells = (): HTMLElement[] =>
  [...document.querySelectorAll<HTMLElement>('[role="gridcell"]')]

/** First grid cell whose trimmed text equals `text`, or `undefined`. */
export const cellByText = (text: string): HTMLElement | undefined =>
  cells().find((c) => c.textContent?.trim() === text)

/** Synthesize a full mousedown → mouseup → click sequence on the target. */
export const mouseClick = (target: Element, mod: { shiftKey?: boolean } = {}): void => {
  const init = { bubbles: true, button: 0, ...mod }
  target.dispatchEvent(new MouseEvent('mousedown', init))
  target.dispatchEvent(new MouseEvent('mouseup', init))
  target.dispatchEvent(new MouseEvent('click', init))
}

/**
 * Register beforeEach/afterEach hooks that mount/unmount a fresh React root on a
 * scratch host div. Returns a holder whose `.root` / `.host` are valid inside each
 * `it()` body.
 */
export function setupReactDom(): { root: Root; host: HTMLDivElement } {
  const state = {} as { root: Root; host: HTMLDivElement }
  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true
    localStorage.clear()
    state.host = document.createElement('div')
    document.body.append(state.host)
    state.root = createRoot(state.host)
  })
  afterEach(() => {
    act(() => state.root.unmount())
    state.host.remove()
    localStorage.clear()
  })
  return state
}
