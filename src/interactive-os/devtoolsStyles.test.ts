import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('REC devtools styles', () => {
  const css = () => readFileSync(join(process.cwd(), 'src/interactive-os/devtools.css'), 'utf8')

  it('uses spreadsheet design tokens for idle overlay chrome', () => {
    const source = css()

    expect(source).toContain('border: 1px solid var(--sheet-color-border, #dadce0);')
    expect(source).toContain('background: var(--sheet-color-surface, #fff);')
    expect(source).toContain('box-shadow: var(--sheet-shadow-menu, 0 2px 8px rgba(0, 0, 0, .1));')
  })

  it('uses spreadsheet design tokens for idle overlay layout and type', () => {
    const source = css()

    expect(source).toContain('top: var(--sheet-space-3, 8px);')
    expect(source).toContain('right: var(--sheet-space-3, 8px);')
    expect(source).toContain('gap: var(--sheet-space-2, 6px);')
    expect(source).toContain('max-width: max(var(--sheet-space-8, 24px), calc(100vw - var(--sheet-space-3, 8px) - var(--sheet-space-3, 8px)));')
    expect(source).toContain('min-width: 0;')
    expect(source).toContain('min-height: var(--sheet-size-cell-min-height, 28px);')
    expect(source).toContain('padding: var(--sheet-space-1, 4px) var(--sheet-space-4, 10px);')
    expect(source).toContain('border-radius: var(--sheet-radius-tab, 6px);')
    expect(source).toContain('font: 700 var(--sheet-font-size-control-xs, 11px)/1 var(--sheet-font-ui, system-ui, sans-serif);')
    expect(source).toContain('border-radius: var(--sheet-radius-round, 999px);')
  })

  it('uses spreadsheet design tokens for overlay text and recording colors', () => {
    const source = css()

    expect(source).toContain('color: var(--sheet-color-text, #202124);')
    expect(source).toContain('background: var(--sheet-color-danger, #d93025);')
    expect(source).toContain('color: var(--sheet-color-surface, #fff);')
    expect(source).toContain('border-color: var(--sheet-color-danger, #d93025);')
  })

  it('keeps the overlay dot stable and clips only the text label', () => {
    const source = css()
    const dotRule = source.match(/\.rec-dot\s*\{[^}]+\}/)?.[0] ?? ''
    const labelRule = source.match(/\.rec-label\s*\{[^}]+\}/)?.[0] ?? ''

    expect(dotRule).toContain('flex: 0 0 auto;')
    expect(dotRule).toContain('width: 7px;')
    expect(dotRule).toContain('height: 7px;')
    expect(labelRule).toContain('min-width: 0;')
    expect(labelRule).toContain('overflow: hidden;')
    expect(labelRule).toContain('text-overflow: ellipsis;')
    expect(labelRule).toContain('white-space: nowrap;')
  })

  it('does not reintroduce replaced direct REC style values', () => {
    const source = css()

    expect(source).not.toMatch(/color:\s*#202124;/)
    expect(source).not.toMatch(/background:\s*#d93025;/)
    expect(source).not.toMatch(/border-color:\s*#d93025;/)
    expect(source).not.toMatch(/color:\s*#fff;/)
    expect(source).not.toMatch(/background:\s*#fff;/)
    expect(source).not.toContain('border: 1px solid rgba(0, 0, 0, .18);')
    expect(source).not.toContain('background: rgba(255, 255, 255, .92);')
    expect(source).not.toContain('box-shadow: 0 2px 10px rgba(0, 0, 0, .14);')
    expect(source).not.toMatch(/top:\s*8px;/)
    expect(source).not.toMatch(/right:\s*8px;/)
    expect(source).not.toMatch(/gap:\s*6px;/)
    expect(source).not.toMatch(/min-height:\s*28px;/)
    expect(source).not.toMatch(/padding:\s*4px 10px;/)
    expect(source).not.toMatch(/border-radius:\s*6px;/)
    expect(source).not.toMatch(/font:\s*700 11px\/1 system-ui, sans-serif;/)
    expect(source).not.toMatch(/border-radius:\s*999px;/)
  })
})
