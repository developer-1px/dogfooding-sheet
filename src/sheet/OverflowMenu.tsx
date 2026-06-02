import { useMemo, useRef } from 'react'
import { fromList, type UiEvent } from '@interactive-os/aria-kernel'
import { useMenuButtonPattern } from '@interactive-os/aria-kernel/patterns'
import { downloadFile } from '../lib/downloadFile'
import type { Confirm } from './useConfirm'
import type { Display, Sheet, WriteCell, WriteCellRange, WriteMany } from './schema'
import {
  exportOverflowCsv,
  exportOverflowJson,
  importOverflowCsv,
  importOverflowJson,
  overflowMenuItemId,
  overflowMenuItems,
  runOverflowMenuCommand,
} from './overflowMenuActions'

export interface OverflowProps {
  display: Display
  writeCell: WriteCell
  writeCells: WriteMany
  writeCellRange: WriteCellRange
  openHelp: () => void
  insertLink: () => void
  sheet: Sheet
  previewSheetReplacement?: (sheet: Sheet) => Sheet | null
  applySheetReplacement: (sheet: Sheet) => boolean
  clearCellValues: () => boolean
  confirm: Confirm
  showFormulas: boolean
  toggleShowFormulas: () => void
  showGridlines: boolean
  toggleShowGridlines: () => void
  clearAllFormats: () => boolean
}

export function OverflowMenu({ display, writeCell, writeCells, writeCellRange, openHelp, insertLink, sheet, previewSheetReplacement, applySheetReplacement, clearCellValues, confirm, showFormulas, toggleShowFormulas, showGridlines, toggleShowGridlines, clearAllFormats }: OverflowProps) {
  const fileRef = useRef<HTMLInputElement | null>(null)
  const jsonRef = useRef<HTMLInputElement | null>(null)
  const exportCsvFile = () => exportOverflowCsv({ display, sheet, downloadFile })
  const importCsvFile = (file: File) => importOverflowCsv({ file, confirm, sheet, writeCell, writeCells, writeCellRange })
  const exportJson = () => exportOverflowJson({ sheet, downloadFile })
  const importJson = (file: File) => importOverflowJson({ file, confirm, previewSheetReplacement, applySheetReplacement })

  const items = useMemo(() => overflowMenuItems({ showFormulas, showGridlines }), [showFormulas, showGridlines])
  const data = fromList(items.map(({ id, label }) => ({ id, label })))

  const onEvent = (e: UiEvent) => {
    if (e.type === 'activate' && e.id) {
      const id = overflowMenuItemId(e.id)
      if (!id) return
      void runOverflowMenuCommand(id, {
        openHelp,
        toggleShowFormulas,
        toggleShowGridlines,
        insertLink,
        print: () => window.print(),
        exportCsv: exportCsvFile,
        openCsvImport: () => fileRef.current?.click(),
        exportJson,
        openJsonImport: () => jsonRef.current?.click(),
        confirm,
        clearCellValues,
        clearAllFormats,
      })
    }
  }

  const { triggerProps, menuProps, itemProps, open } = useMenuButtonPattern(data, onEvent, {
    label: '추가 메뉴',
  })

  return (
    <span className="overflow-menu">
      <button {...triggerProps} className="overflow-trigger" title="더 보기">⋮</button>
      {open && (
        <div {...menuProps} className="overflow-list">
          {items.map((it) => (
            <button key={it.id} {...itemProps(it.id)} className="overflow-item">{it.label}</button>
          ))}
        </div>
      )}
      <input ref={fileRef} type="file" accept=".csv,text/csv" style={{ display: 'none' }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) importCsvFile(f); e.target.value = '' }} />
      <input ref={jsonRef} type="file" accept=".json,application/json" style={{ display: 'none' }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) importJson(f); e.target.value = '' }} />
    </span>
  )
}
