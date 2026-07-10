import { describe, expect, it } from 'vitest'
import { DEFAULT_WIDTH } from '../../../features/sheet-layout/hooks/useColWidths'
import { DEFAULT_HEIGHT } from '../../../features/sheet-layout/hooks/useRowHeights'
import { sheetPromptActions, type SheetPromptController } from './sheetPromptActions'
import type { Ask, PromptOptions } from '../../../shared/ports/dialog'

const flush = () => Promise.resolve()

function askQueue(values: Array<string | null>, prompts: PromptOptions[] = []): Ask {
  let index = 0
  return (opts) => {
    prompts.push(opts)
    return Promise.resolve(index < values.length ? values[index++] : null)
  }
}

const rejectingAsk = (): Ask => () => Promise.reject(new Error('closed'))

function fakeCtx(calls: string[] = [], overrides: Partial<SheetPromptController> = {}): SheetPromptController {
  return {
    rowCount: 10,
    colCount: 5,
    focusKey: 'B2',
    sheet: { colWidths: { B: 80 } },
    filter: null,
    rowHeightOf: () => 32,
    setFocusId: (id: string) => calls.push(`setFocusId:${id}`),
    setSelectedIds: (ids: string[]) => calls.push(`setSelectedIds:${ids.join(',')}`),
    setSelectAnchor: (id: string | null) => calls.push(`setSelectAnchor:${id ?? ''}`),
    noteOf: (key: string) => key === 'B2' ? 'old note' : undefined,
    setNote: (key: string, text: string) => calls.push(`setNote:${key}:${text}`),
    writeCell: (key: string, value: string) => calls.push(`writeCell:${key}:${value}`),
    setRowHeight: (row: number, height: number) => calls.push(`setRowHeight:${row}:${height}`),
    setColWidth: (col: string, width: number) => calls.push(`setColWidth:${col}:${width}`),
    clearFilter: () => calls.push('clearFilter'),
    applyFilter: (col: string, text: string) => calls.push(`applyFilter:${col}:${text}`),
    ...overrides,
  }
}

describe('sheetPromptActions', () => {
  it('opens goto prompt and applies a valid target', async () => {
    const calls: string[] = []
    const actions = sheetPromptActions(askQueue(['C3']), () => fakeCtx(calls))

    actions.openGoto()
    await flush()

    expect(calls).toEqual(['setFocusId:r2-C', 'setSelectedIds:', 'setSelectAnchor:r2-C'])
  })

  it('edits notes through the prompt result', async () => {
    const calls: string[] = []
    const prompts: PromptOptions[] = []
    const actions = sheetPromptActions(askQueue(['new note'], prompts), () => fakeCtx(calls))

    actions.openNote()
    await flush()

    expect(prompts[0]).toMatchObject({ label: '셀 노트', initial: 'old note' })
    expect(calls).toEqual(['setNote:B2:new note'])
  })

  it('uses spreadsheet string escaping when inserting hyperlink formulas', async () => {
    const calls: string[] = []
    const actions = sheetPromptActions(askQueue(['https://example.com/"q"']), () => fakeCtx(calls))

    actions.openLink()
    await flush()

    expect(calls).toEqual(['writeCell:B2:=HYPERLINK("https://example.com/""q""", "https://example.com/""q""")'])
  })

  it('applies row and column size prompts with default fallbacks', async () => {
    const calls: string[] = []
    const prompts: PromptOptions[] = []
    const actions = sheetPromptActions(askQueue(['', '144'], prompts), () => fakeCtx(calls))

    actions.promptRowHeight(4)
    await flush()
    actions.promptColWidth('B')
    await flush()

    expect(prompts.map((prompt) => prompt.initial)).toEqual(['32', '80'])
    expect(calls).toEqual([`setRowHeight:4:${DEFAULT_HEIGHT}`, 'setColWidth:B:144'])
  })

  it('clears or applies filters from prompt values', async () => {
    const calls: string[] = []
    const prompts: PromptOptions[] = []
    const ctx = fakeCtx(calls, { filter: { col: 'B', text: 'open' } })
    const actions = sheetPromptActions(askQueue(['', 'closed'], prompts), () => ctx)

    actions.promptFilter('B')
    await flush()
    actions.promptFilter('C')
    await flush()

    expect(prompts.map((prompt) => prompt.initial)).toEqual(['open', ''])
    expect(calls).toEqual(['clearFilter', 'applyFilter:C:closed'])
  })

  it('uses width default when a column has no custom width', async () => {
    const calls: string[] = []
    const prompts: PromptOptions[] = []
    const ctx = fakeCtx(calls, { sheet: { colWidths: {} } })
    const actions = sheetPromptActions(askQueue([''], prompts), () => ctx)

    actions.promptColWidth('C')
    await flush()

    expect(prompts[0].initial).toBe(String(DEFAULT_WIDTH))
    expect(calls).toEqual([`setColWidth:C:${DEFAULT_WIDTH}`])
  })

  it('ignores malformed row and column size prompt values', async () => {
    const calls: string[] = []
    const actions = sheetPromptActions(askQueue(['wide', 'Infinity']), () => fakeCtx(calls))

    actions.promptRowHeight(4)
    await flush()
    actions.promptColWidth('B')
    await flush()

    expect(calls).toEqual([])
  })

  it('absorbs rejected prompts and action failures', async () => {
    const calls: string[] = []
    const rejected = sheetPromptActions(rejectingAsk(), () => fakeCtx(calls))

    rejected.openGoto()
    await flush()

    const failingApply = sheetPromptActions(askQueue(['https://example.com']), () =>
      fakeCtx(calls, { writeCell: () => { throw new Error('blocked') } }))
    failingApply.openLink()
    await flush()
    await flush()

    expect(calls).toEqual([])
  })
})
