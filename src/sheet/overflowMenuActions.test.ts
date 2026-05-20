import { describe, expect, it } from 'vitest'
import {
  exportOverflowCsv,
  exportOverflowJson,
  importOverflowCsv,
  importOverflowJson,
  MAX_IMPORT_FILE_BYTES,
  overflowMenuItemId,
  overflowMenuItems,
  runOverflowMenuCommand,
} from './overflowMenuActions'
import { initialSheet, type Sheet } from './schema'
import type { Confirm, ConfirmOptions } from './useConfirm'

const textFile = (text: string, size = text.length): File => ({ size, text: () => Promise.resolve(text) }) as File

function confirmValue(value: boolean, prompts: ConfirmOptions[] = []): Confirm {
  return (opts) => {
    prompts.push(opts)
    return Promise.resolve(value)
  }
}

describe('overflowMenuActions', () => {
  it('builds stateful menu labels and validates menu ids', () => {
    expect(overflowMenuItems({ showFormulas: true, showGridlines: false }).map((item) => item.label)).toContain('✓ 수식 표시 (Ctrl/⌘+`)')
    expect(overflowMenuItems({ showFormulas: false, showGridlines: true }).map((item) => item.label)).toContain('✓ 격자선 표시')
    expect(overflowMenuItems({ showFormulas: false, showGridlines: false }).map((item) => item.label)).toContain('전체 값 지우기')
    expect(overflowMenuItemId('csv-export')).toBe('csv-export')
    expect(overflowMenuItemId('unknown')).toBeNull()
  })

  it('exports the displayed sheet to CSV', () => {
    const downloads: string[] = []

    exportOverflowCsv({
      display: (key) => ({ A1: 'Item', B1: 'Qty', A2: 'Apple', B2: '3' })[key] ?? '',
      sheet: { rowCount: 20, colCount: 3 },
      downloadFile: (name, content) => downloads.push(`${name}:${content}`),
    })

    expect(downloads).toEqual(['sheet.csv:Item,Qty\nApple,3'])
  })

  it('imports CSV after confirmation through batched writes', async () => {
    const writes: string[] = []
    const prompts: ConfirmOptions[] = []

    await expect(importOverflowCsv({
      file: textFile('a,b\n1,2'),
      confirm: confirmValue(true, prompts),
      sheet: { rowCount: 20, colCount: 2 },
      writeCell: (key, value) => writes.push(`cell:${key}:${value}`),
      writeCells: (batch) => writes.push(`batch:${batch.map(([key, value]) => `${key}:${value}`).join('|')}`),
    })).resolves.toBe(true)

    expect(prompts[0]).toMatchObject({ confirmLabel: '가져오기' })
    expect(writes).toEqual(['batch:A1:a|B1:b|A2:1|B2:2'])
  })

  it('imports only cells inside the sheet dimensions', async () => {
    const writes: string[] = []

    await expect(importOverflowCsv({
      file: textFile('a,b,c\n1,2,3\nx,y,z'),
      confirm: confirmValue(true),
      sheet: { rowCount: 1, colCount: 2 },
      writeCell: (key, value) => writes.push(`cell:${key}:${value}`),
      writeCells: (batch) => writes.push(`batch:${batch.map(([key, value]) => `${key}:${value}`).join('|')}`),
    })).resolves.toBe(true)

    expect(writes).toEqual(['batch:A1:a|B1:b'])
  })

  it('does not import CSV when confirmation is rejected', async () => {
    const writes: string[] = []

    await expect(importOverflowCsv({
      file: textFile('a,b'),
      confirm: confirmValue(false),
      sheet: { rowCount: 20, colCount: 2 },
      writeCell: (key, value) => writes.push(`cell:${key}:${value}`),
      writeCells: (batch) => writes.push(`batch:${batch.length}`),
    })).resolves.toBe(false)

    expect(writes).toEqual([])
  })

  it('rejects malformed or oversized CSV before confirmation', async () => {
    const writes: string[] = []
    const prompts: ConfirmOptions[] = []

    await expect(importOverflowCsv({
      file: textFile('a,"b'),
      confirm: confirmValue(true, prompts),
      sheet: { rowCount: 20, colCount: 2 },
      writeCell: (key, value) => writes.push(`cell:${key}:${value}`),
      writeCells: (batch) => writes.push(`batch:${batch.length}`),
    })).resolves.toBe(false)

    await expect(importOverflowCsv({
      file: textFile('a,b', MAX_IMPORT_FILE_BYTES + 1),
      confirm: confirmValue(true, prompts),
      sheet: { rowCount: 20, colCount: 2 },
      writeCell: (key, value) => writes.push(`cell:${key}:${value}`),
      writeCells: (batch) => writes.push(`batch:${batch.length}`),
    })).resolves.toBe(false)

    expect(prompts).toEqual([])
    expect(writes).toEqual([])
  })

  it('exports and imports JSON sheets', async () => {
    const downloads: Array<{ name: string; content: string }> = []
    const resets: Sheet[] = []

    exportOverflowJson({
      sheet: initialSheet,
      downloadFile: (name, content) => downloads.push({ name, content }),
    })

    expect(downloads[0].name).toBe('sheet.json')
    expect(JSON.parse(downloads[0].content).cells.A1).toBe('Item')

    await expect(importOverflowJson({
      file: textFile(JSON.stringify(initialSheet)),
      confirm: confirmValue(true),
      resetSheet: (sheet) => resets.push(sheet),
    })).resolves.toBe(true)

    expect(resets[0].cells.A1).toBe('Item')
  })

  it('imports JSON by preserving valid cells and dropping malformed ancillary state', async () => {
    const resets: Sheet[] = []

    await expect(importOverflowJson({
      file: textFile(JSON.stringify({
        ...initialSheet,
        cells: { A1: 'Imported', B1: 42 },
        hidden: { rows: 'bad', cols: ['A'] },
      })),
      confirm: confirmValue(true),
      resetSheet: (sheet) => resets.push(sheet),
    })).resolves.toBe(true)

    expect(resets[0].cells).toEqual({ A1: 'Imported' })
    expect(resets[0].hidden).toEqual({ rows: [], cols: ['A'] })
  })

  it('skips invalid or rejected JSON imports', async () => {
    const resets: Sheet[] = []
    const prompts: ConfirmOptions[] = []

    await expect(importOverflowJson({
      file: textFile('{bad'),
      confirm: confirmValue(true, prompts),
      resetSheet: (sheet) => resets.push(sheet),
    })).resolves.toBe(false)

    await expect(importOverflowJson({
      file: textFile(JSON.stringify(initialSheet), MAX_IMPORT_FILE_BYTES + 1),
      confirm: confirmValue(true, prompts),
      resetSheet: (sheet) => resets.push(sheet),
    })).resolves.toBe(false)

    await expect(importOverflowJson({
      file: textFile(JSON.stringify(initialSheet)),
      confirm: confirmValue(false, prompts),
      resetSheet: (sheet) => resets.push(sheet),
    })).resolves.toBe(false)

    expect(resets).toEqual([])
    expect(prompts).toHaveLength(1)
  })

  it('dispatches simple menu commands', async () => {
    const calls: string[] = []
    const commands = {
      openHelp: () => calls.push('help'),
      toggleShowFormulas: () => calls.push('formulas'),
      toggleShowGridlines: () => calls.push('gridlines'),
      insertLink: () => calls.push('link'),
      print: () => calls.push('print'),
      exportCsv: () => calls.push('csv-export'),
      openCsvImport: () => calls.push('csv-import'),
      exportJson: () => calls.push('json-export'),
      openJsonImport: () => calls.push('json-import'),
      confirm: confirmValue(true),
      clearCellValues: () => calls.push('clear-values'),
      clearAllFormats: () => calls.push('clear-formats'),
    }

    await runOverflowMenuCommand('help', commands)
    await runOverflowMenuCommand('show-formulas', commands)
    await runOverflowMenuCommand('show-gridlines', commands)
    await runOverflowMenuCommand('link', commands)
    await runOverflowMenuCommand('print', commands)
    await runOverflowMenuCommand('csv-export', commands)
    await runOverflowMenuCommand('csv-import', commands)
    await runOverflowMenuCommand('json-export', commands)
    await runOverflowMenuCommand('json-import', commands)

    expect(calls).toEqual(['help', 'formulas', 'gridlines', 'link', 'print', 'csv-export', 'csv-import', 'json-export', 'json-import'])
  })

  it('confirms destructive menu commands', async () => {
    const calls: string[] = []
    const prompts: ConfirmOptions[] = []

    await expect(runOverflowMenuCommand('clear-values', {
      openHelp: () => {},
      toggleShowFormulas: () => {},
      toggleShowGridlines: () => {},
      insertLink: () => {},
      print: () => {},
      exportCsv: () => {},
      openCsvImport: () => {},
      exportJson: () => {},
      openJsonImport: () => {},
      confirm: confirmValue(true, prompts),
      clearCellValues: (cells) => calls.push(`clear-values:${Object.keys(cells).length}`),
      clearAllFormats: () => calls.push('clear-formats'),
    })).resolves.toBe(true)

    await expect(runOverflowMenuCommand('clear-formats', {
      openHelp: () => {},
      toggleShowFormulas: () => {},
      toggleShowGridlines: () => {},
      insertLink: () => {},
      print: () => {},
      exportCsv: () => {},
      openCsvImport: () => {},
      exportJson: () => {},
      openJsonImport: () => {},
      confirm: confirmValue(false, prompts),
      clearCellValues: (cells) => calls.push(`clear-values:${Object.keys(cells).length}`),
      clearAllFormats: () => calls.push('clear-formats'),
    })).resolves.toBe(false)

    expect(prompts.map((prompt) => prompt.confirmLabel)).toEqual(['지우기', '지우기'])
    expect(prompts[0].message).toContain('셀 값')
    expect(calls).toEqual(['clear-values:0'])
  })
})
