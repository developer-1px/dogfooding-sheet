import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('REC devtools styles', () => {
  const appCss = () => readFileSync(join(process.cwd(), 'src/app/App.css'), 'utf8')
  const css = () => readFileSync(join(process.cwd(), 'src/app/interactive-os/devtools.css'), 'utf8')

  it('uses spreadsheet design tokens for idle overlay chrome', () => {
    const root = appCss()
    const source = css()

    expect(root).toContain('--sheet-size-rec-devtools-border: 1px;')
    expect(source).toContain('border: var(--sheet-size-rec-devtools-border, 1px) solid var(--sheet-color-border, #dadce0);')
    expect(source).toContain('background: var(--sheet-color-surface, #fff);')
    expect(source).toContain('box-shadow: var(--sheet-shadow-menu, 0 2px 8px rgba(0, 0, 0, .1));')
  })

  it('uses spreadsheet design tokens for idle overlay layout and type', () => {
    const root = appCss()
    const source = css()

    expect(root).toContain('--sheet-z-index-rec-devtools: 99999;')
    expect(root).toContain('--sheet-font-weight-bold: 700;')
    expect(source).toContain('z-index: var(--sheet-z-index-rec-devtools, 99999);')
    expect(source).toContain('top: var(--sheet-space-3, 8px);')
    expect(source).toContain('right: var(--sheet-space-3, 8px);')
    expect(source).toContain('gap: var(--sheet-space-2, 6px);')
    expect(source).toContain('max-width: max(var(--sheet-space-8, 24px), calc(100vw - var(--sheet-space-3, 8px) - var(--sheet-space-3, 8px)));')
    expect(source).toContain('min-width: 0;')
    expect(source).toContain('min-height: var(--sheet-size-cell-min-height, 28px);')
    expect(source).toContain('padding: var(--sheet-space-1, 4px) var(--sheet-space-4, 10px);')
    expect(source).toContain('border-radius: var(--sheet-radius-tab, 6px);')
    expect(source).toContain('font: var(--sheet-font-weight-bold, 700) var(--sheet-font-size-control-xs, 11px)/1 var(--sheet-font-ui, system-ui, sans-serif);')
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
    const root = appCss()
    const source = css()
    const dotRule = source.match(/\.rec-dot\s*\{[^}]+\}/)?.[0] ?? ''
    const labelRule = source.match(/\.rec-label\s*\{[^}]+\}/)?.[0] ?? ''

    expect(root).toContain('--sheet-size-rec-dot: 7px;')
    expect(dotRule).toContain('flex: 0 0 auto;')
    expect(dotRule).toContain('width: var(--sheet-size-rec-dot, 7px);')
    expect(dotRule).toContain('height: var(--sheet-size-rec-dot, 7px);')
    expect(dotRule).toContain('border-radius: var(--sheet-radius-round, 999px);')
    expect(labelRule).toContain('min-width: 0;')
    expect(labelRule).toContain('overflow: hidden;')
    expect(labelRule).toContain('text-overflow: ellipsis;')
    expect(labelRule).toContain('white-space: nowrap;')
  })

  it('keeps the recording pulse duration on a motion token', () => {
    const root = appCss()
    const source = css()
    const recordingDotRule = source.match(/\.rec-devtools\.recording\s+\.rec-dot\s*\{[^}]+\}/)?.[0] ?? ''

    expect(root).toContain('--sheet-motion-duration-rec-pulse: 1s;')
    expect(recordingDotRule).toContain('animation: rec-pulse var(--sheet-motion-duration-rec-pulse, 1s) infinite;')
  })

  it('keeps the recording pulse dim state on a state token', () => {
    const root = appCss()
    const source = css()

    expect(root).toContain('--sheet-state-rec-pulse-dim-opacity: .35;')
    expect(source).toContain('50% { opacity: var(--sheet-state-rec-pulse-dim-opacity, .35); }')
  })

  it('does not reintroduce replaced direct REC style values', () => {
    const source = css()

    expect(source).not.toMatch(/color:\s*#202124;/)
    expect(source).not.toMatch(/background:\s*#d93025;/)
    expect(source).not.toMatch(/border-color:\s*#d93025;/)
    expect(source).not.toMatch(/color:\s*#fff;/)
    expect(source).not.toMatch(/background:\s*#fff;/)
    expect(source).not.toContain('border: 1px solid var(--sheet-color-border, #dadce0);')
    expect(source).not.toContain('border: 1px solid rgba(0, 0, 0, .18);')
    expect(source).not.toContain('background: rgba(255, 255, 255, .92);')
    expect(source).not.toContain('box-shadow: 0 2px 10px rgba(0, 0, 0, .14);')
    expect(source).not.toMatch(/top:\s*8px;/)
    expect(source).not.toMatch(/right:\s*8px;/)
    expect(source).not.toMatch(/z-index:\s*99999;/)
    expect(source).not.toMatch(/gap:\s*6px;/)
    expect(source).not.toMatch(/min-height:\s*28px;/)
    expect(source).not.toMatch(/padding:\s*4px 10px;/)
    expect(source).not.toMatch(/border-radius:\s*6px;/)
    expect(source).not.toContain('font: 700 var(--sheet-font-size-control-xs, 11px)/1 var(--sheet-font-ui, system-ui, sans-serif);')
    expect(source).not.toMatch(/font:\s*700 11px\/1 system-ui, sans-serif;/)
    expect(source).not.toContain('animation: rec-pulse 1s infinite;')
    expect(source).not.toContain('50% { opacity: .35; }')
    expect(source).not.toMatch(/border-radius:\s*999px;/)
    expect(source).not.toMatch(/width:\s*7px;/)
    expect(source).not.toMatch(/height:\s*7px;/)
  })
})
