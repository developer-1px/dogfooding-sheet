import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach } from 'vitest'

type KeyMod = { ctrlKey?: boolean; metaKey?: boolean; shiftKey?: boolean; altKey?: boolean }

/** Dispatch a `keydown` on `window` with optional modifier keys. */
export const press = (key: string, mod: KeyMod = {}): void => {
  window.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key, ...mod }))
}

/** Dispatch a `keydown` on a specific element (cell, input, formula bar, …). */
export const keyDown = (target: EventTarget, key: string, mod: KeyMod = {}): void => {
  target.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key, ...mod }))
}

/**
 * Set an input's value via React's native setter and fire an `input` event —
 * the only way to make React see a programmatic value change in jsdom.
 */
export const setInputValue = (input: HTMLInputElement, value: string): void => {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
  setter.call(input, value)
  input.dispatchEvent(new Event('input', { bubbles: true }))
}

export const cellEditor = (): HTMLElement | null =>
  document.querySelector<HTMLElement>('[data-nano-inline-edit="true"]')

export const setContenteditableText = (editor: HTMLElement, value: string): void => {
  editor.textContent = value
  editor.dispatchEvent(new Event('input', { bubbles: true }))
}

export const contenteditableSelectionOffset = (editor: HTMLElement): number | null => {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return null
  const range = selection.getRangeAt(0)
  if (!editor.contains(range.startContainer)) return null
  return range.startOffset
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
export function setupReactDOM(): { root: Root; host: HTMLDivElement } {
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
