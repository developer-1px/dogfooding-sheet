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

/** Synthesize a full mousedown → mouseup → click sequence on the target. */
export const mouseClick = (target: Element): void => {
  target.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 }))
  target.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, button: 0 }))
  target.dispatchEvent(new MouseEvent('click', { bubbles: true, button: 0 }))
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
