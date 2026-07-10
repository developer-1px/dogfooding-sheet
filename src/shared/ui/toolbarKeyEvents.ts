import type { KeyboardEvent } from 'react'

const TOOLBAR_ACTIVATION_KEYS = new Set(['Enter', ' '])

export const stopToolbarActivationKeyDown = (event: KeyboardEvent<HTMLElement>) => {
  if (TOOLBAR_ACTIVATION_KEYS.has(event.key)) event.stopPropagation()
}
