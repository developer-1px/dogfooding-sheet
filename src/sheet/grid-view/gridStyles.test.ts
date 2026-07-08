import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('grid styles', () => {
  const appCss = () => readFileSync(join(process.cwd(), 'src/App.css'), 'utf8')
  const gridCss = () => readFileSync(join(process.cwd(), 'src/sheet/grid-view/grid.css'), 'utf8')

  it('declares the formula reference palette as design tokens', () => {
    const source = appCss()

    expect(source).toContain('--sheet-color-formula-ref-0: var(--sheet-color-accent);')
    expect(source).toContain('--sheet-color-formula-ref-1: var(--sheet-color-danger);')
    expect(source).toContain('--sheet-color-formula-ref-2: var(--sheet-color-success);')
    expect(source).toContain('--sheet-color-formula-ref-3: #a142f4;')
    expect(source).toContain('--sheet-color-formula-ref-4: #f29900;')
    expect(source).toContain('--sheet-color-formula-ref-5: #00897b;')
    expect(source).toContain('--sheet-state-formula-ref-0-bg: rgba(26, 115, 232, .12);')
    expect(source).toContain('--sheet-state-formula-ref-1-bg: rgba(217, 48, 37, .10);')
    expect(source).toContain('--sheet-state-formula-ref-2-bg: rgba(24, 128, 56, .11);')
    expect(source).toContain('--sheet-state-formula-ref-3-bg: rgba(161, 66, 244, .10);')
    expect(source).toContain('--sheet-state-formula-ref-4-bg: rgba(242, 153, 0, .13);')
    expect(source).toContain('--sheet-state-formula-ref-5-bg: rgba(0, 137, 123, .11);')
  })

  it('keeps formula reference classes wired to palette tokens', () => {
    const source = gridCss()
    const formulaRefRules = [...source.matchAll(/\.formula-ref-\d\s*\{[^}]+\}/g)].map((match) => match[0])

    expect(formulaRefRules).toHaveLength(6)
    for (let index = 0; index < 6; index++) {
      expect(formulaRefRules[index]).toContain(`--formula-ref-color: var(--sheet-color-formula-ref-${index});`)
      expect(formulaRefRules[index]).toContain(`--formula-ref-bg: var(--sheet-state-formula-ref-${index}-bg);`)
    }
    expect(formulaRefRules.join('\n')).not.toMatch(/#[0-9a-fA-F]{3,8}|rgba\(/)
  })
})
