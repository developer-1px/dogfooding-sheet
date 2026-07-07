import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { activeToolbarStateStyle } from './toolbarStyles'

describe('toolbarStyles', () => {
  it('uses the accent-muted design token for active toolbar states', () => {
    expect(activeToolbarStateStyle).toEqual({
      background: 'var(--sheet-color-accent-muted, #e8f0fe)',
    })
  })

  it('keeps Toolbar active buttons wired to the shared active state style', () => {
    const source = readFileSync(join(process.cwd(), 'src/sheet/Toolbar.tsx'), 'utf8')

    expect(source).toContain('style={freeze.rows ? activeToolbarStateStyle : undefined}')
    expect(source).toContain('style={freeze.cols ? activeToolbarStateStyle : undefined}')
    expect(source).toContain('style={filter ? activeToolbarStateStyle : undefined}')
    expect(source).not.toContain("background: '#e8f0fe'")
  })
})
