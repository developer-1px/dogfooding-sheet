import { describe, expect, it } from 'vitest'
import { activeToolbarStateStyle } from './toolbarStyles'

describe('toolbarStyles', () => {
  it('uses the accent-muted design token for active toolbar states', () => {
    expect(activeToolbarStateStyle).toEqual({
      background: 'var(--sheet-color-accent-muted, #e8f0fe)',
    })
  })
})
