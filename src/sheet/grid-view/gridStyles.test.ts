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

  it('reserves inline-end space for cell note and dropdown markers', () => {
    const source = gridCss()

    expect(source).toContain('.cell.has-note-marker, .cell.has-dropdown-marker { padding-inline-end: var(--sheet-space-8, 24px); }')
  })

  it('keeps note markers token-sized at the cell corner', () => {
    const root = appCss()
    const source = gridCss()
    const noteRule = source.match(/\.note-mark\s*\{[^}]+\}/)?.[0] ?? ''

    expect(root).toContain('--sheet-size-note-marker: 6px;')
    expect(noteRule).toContain('position: absolute;')
    expect(noteRule).toContain('top: 0;')
    expect(noteRule).toContain('right: 0;')
    expect(noteRule).toContain('border-style: solid;')
    expect(noteRule).toContain('border-width: 0 var(--sheet-size-note-marker, 6px) var(--sheet-size-note-marker, 6px) 0;')
    expect(noteRule).toContain('border-color: transparent var(--sheet-color-warning, #fbbc04) transparent transparent;')
    expect(noteRule).toContain('pointer-events: none;')
  })

  it('keeps cell state outlines token-sized inside the cell', () => {
    const root = appCss()
    const source = gridCss()
    const focusedRule = source.match(/\.cell\.focused\s*\{[^}]+\}/)?.[0] ?? ''
    const refRule = source.match(/\.cell\.ref-hi\s*\{[^}]+\}/)?.[0] ?? ''
    const previewRule = source.match(/\.cell\.preview\s*\{[^}]+\}/)?.[0] ?? ''
    const inputRule = source.match(/\.cell-input\s*\{[^}]+\}/)?.[0] ?? ''
    const outline = 'var(--sheet-size-cell-state-outline, 2px)'
    const insideOffset = `calc(-1 * ${outline})`

    expect(root).toContain('--sheet-size-cell-state-outline: 2px;')
    expect(focusedRule).toContain(`outline: ${outline} solid var(--sheet-color-accent, #1a73e8);`)
    expect(focusedRule).toContain(`outline-offset: ${insideOffset};`)
    expect(focusedRule).toContain('z-index: 1;')
    expect(refRule).toContain(`outline: ${outline} solid var(--sheet-color-success, #188038);`)
    expect(refRule).toContain(`outline-offset: ${insideOffset};`)
    expect(refRule).toContain('background: var(--sheet-state-success-bg, rgba(24, 128, 56, .08));')
    expect(previewRule).toContain(`outline: ${outline} dashed var(--sheet-color-accent, #1a73e8);`)
    expect(previewRule).toContain(`outline-offset: ${insideOffset};`)
    expect(previewRule).toContain('background: var(--sheet-state-accent-preview, rgba(26, 115, 232, .15));')
    expect(inputRule).toContain(`border: ${outline} solid var(--sheet-color-accent, #1a73e8);`)
    expect(inputRule).toContain('box-sizing: border-box;')
  })

  it('keeps cell links constrained to the cell inline size', () => {
    const source = gridCss()
    const linkRule = source.match(/\.cell-link\s*\{[^}]+\}/)?.[0] ?? ''

    expect(linkRule).toContain('display: inline-block;')
    expect(linkRule).toContain('max-width: 100%;')
    expect(linkRule).toContain('overflow: hidden;')
    expect(linkRule).toContain('text-overflow: ellipsis;')
    expect(linkRule).toContain('white-space: inherit;')
  })

  it('keeps checkbox controls stable inside cells', () => {
    const source = gridCss()
    const checkboxRule = source.match(/\.cell-checkbox\s*\{[^}]+\}/)?.[0] ?? ''

    expect(checkboxRule).toContain('width: var(--sheet-size-control-md, 18px);')
    expect(checkboxRule).toContain('height: var(--sheet-size-control-md, 18px);')
    expect(checkboxRule).toContain('margin: 0;')
    expect(checkboxRule).toContain('vertical-align: middle;')
    expect(checkboxRule).toContain('accent-color: var(--sheet-color-accent, #1a73e8);')
  })

  it('keeps header label content contained inside header tracks', () => {
    const source = gridCss()
    const headerLabelRule = source.match(/\.header-cell-label\s*\{[^}]+\}/)?.[0] ?? ''
    const headerTextRule = source.match(/\.header-cell-text,\s*\.row-header-label\s*\{[^}]+\}/)?.[0] ?? ''
    const rowLabelRule = source.match(/(?:^|\n)\.row-header-label\s*\{[^}]+\}/)?.[0] ?? ''
    const filterMarkRule = source.match(/\.filter-mark\s*\{[^}]+\}/)?.[0] ?? ''

    expect(headerLabelRule).toContain('display: inline-flex;')
    expect(headerLabelRule).toContain('max-width: 100%;')
    expect(headerLabelRule).toContain('overflow: hidden;')
    expect(headerTextRule).toContain('text-overflow: ellipsis;')
    expect(headerTextRule).toContain('white-space: nowrap;')
    expect(rowLabelRule).toContain('display: inline-block;')
    expect(filterMarkRule).toContain('flex: 0 0 auto;')
  })

  it('keeps hidden header restore controls token-sized and centered', () => {
    const source = gridCss()
    const restoreRule = source.match(/\.unhide-col,\s*\.unhide-row\s*\{[^}]+\}/)?.[0] ?? ''
    const leftRule = source.match(/\.unhide-col\.left\s*\{[^}]+\}/)?.[0] ?? ''
    const rightRule = source.match(/\.unhide-col\.right\s*\{[^}]+\}/)?.[0] ?? ''
    const topRule = source.match(/\.unhide-row\.top\s*\{[^}]+\}/)?.[0] ?? ''
    const bottomRule = source.match(/\.unhide-row\.bottom\s*\{[^}]+\}/)?.[0] ?? ''
    const restoreOffset = 'calc(-1 * var(--sheet-size-control-sm, 16px) / 2)'

    expect(restoreRule).toContain('position: absolute;')
    expect(restoreRule).toContain('display: inline-flex;')
    expect(restoreRule).toContain('align-items: center;')
    expect(restoreRule).toContain('justify-content: center;')
    expect(restoreRule).toContain('width: var(--sheet-size-control-sm, 16px);')
    expect(restoreRule).toContain('height: var(--sheet-size-control-sm, 16px);')
    expect(restoreRule).toContain('padding: 0;')
    expect(restoreRule).toContain('line-height: 1;')
    expect(restoreRule).not.toContain('line-height: 14px;')
    expect(leftRule).toContain(`left: ${restoreOffset};`)
    expect(rightRule).toContain(`right: ${restoreOffset};`)
    expect(topRule).toContain(`top: ${restoreOffset};`)
    expect(bottomRule).toContain(`bottom: ${restoreOffset};`)
    expect(leftRule).toContain('top: 50%;')
    expect(rightRule).toContain('top: 50%;')
    expect(topRule).toContain('left: 50%;')
    expect(bottomRule).toContain('left: 50%;')
    expect(leftRule).toContain('transform: translateY(-50%);')
    expect(rightRule).toContain('transform: translateY(-50%);')
    expect(topRule).toContain('transform: translateX(-50%);')
    expect(bottomRule).toContain('transform: translateX(-50%);')
  })

  it('keeps grid resize handles token-sized around header edges', () => {
    const root = appCss()
    const source = gridCss()
    const colResizerRule = source.match(/\.col-resizer\s*\{[^}]+\}/)?.[0] ?? ''
    const rowResizerRule = source.match(/\.row-resizer\s*\{[^}]+\}/)?.[0] ?? ''

    expect(root).toContain('--sheet-size-grid-resizer-hit-area: 6px;')
    expect(root).toContain('--sheet-size-grid-resizer-offset: 3px;')
    expect(colResizerRule).toContain('right: calc(-1 * var(--sheet-size-grid-resizer-offset, 3px));')
    expect(colResizerRule).toContain('width: var(--sheet-size-grid-resizer-hit-area, 6px);')
    expect(colResizerRule).toContain('height: 100%;')
    expect(rowResizerRule).toContain('bottom: calc(-1 * var(--sheet-size-grid-resizer-offset, 3px));')
    expect(rowResizerRule).toContain('width: 100%;')
    expect(rowResizerRule).toContain('height: var(--sheet-size-grid-resizer-hit-area, 6px);')
    expect(colResizerRule).toContain('cursor: col-resize;')
    expect(rowResizerRule).toContain('cursor: row-resize;')
  })

  it('keeps the fill handle token-sized at the focused cell corner', () => {
    const root = appCss()
    const source = gridCss()
    const fillHandleRule = source.match(/\.fill-handle\s*\{[^}]+\}/)?.[0] ?? ''

    expect(root).toContain('--sheet-size-fill-handle: 7px;')
    expect(root).toContain('--sheet-size-fill-handle-offset: 3px;')
    expect(fillHandleRule).toContain('position: absolute;')
    expect(fillHandleRule).toContain('right: calc(-1 * var(--sheet-size-fill-handle-offset, 3px));')
    expect(fillHandleRule).toContain('bottom: calc(-1 * var(--sheet-size-fill-handle-offset, 3px));')
    expect(fillHandleRule).toContain('width: var(--sheet-size-fill-handle, 7px);')
    expect(fillHandleRule).toContain('height: var(--sheet-size-fill-handle, 7px);')
    expect(fillHandleRule).toContain('background: var(--sheet-color-accent, #1a73e8);')
    expect(fillHandleRule).toContain('border: 1px solid var(--sheet-color-surface, #fff);')
    expect(fillHandleRule).toContain('cursor: crosshair;')
    expect(fillHandleRule).toContain('z-index: 2;')
  })
})
