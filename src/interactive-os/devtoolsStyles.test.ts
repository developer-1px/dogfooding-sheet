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

  it('uses spreadsheet design tokens for overlay text and recording colors', () => {
    const source = css()

    expect(source).toContain('color: var(--sheet-color-text, #202124);')
    expect(source).toContain('background: var(--sheet-color-danger, #d93025);')
    expect(source).toContain('color: var(--sheet-color-surface, #fff);')
    expect(source).toContain('border-color: var(--sheet-color-danger, #d93025);')
  })

  it('does not use direct color literals for tokenized REC states', () => {
    const source = css()

    expect(source).not.toMatch(/color:\s*#202124;/)
    expect(source).not.toMatch(/background:\s*#d93025;/)
    expect(source).not.toMatch(/border-color:\s*#d93025;/)
    expect(source).not.toMatch(/color:\s*#fff;/)
    expect(source).not.toMatch(/background:\s*#fff;/)
    expect(source).not.toContain('border: 1px solid rgba(0, 0, 0, .18);')
    expect(source).not.toContain('background: rgba(255, 255, 255, .92);')
    expect(source).not.toContain('box-shadow: 0 2px 10px rgba(0, 0, 0, .14);')
  })
})
