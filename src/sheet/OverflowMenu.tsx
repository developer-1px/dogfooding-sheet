import { useMemo, useRef, type KeyboardEvent } from 'react'
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

const recordEntryCount = (record: Record<string, unknown>): number =>
  Object.keys(record).length

const isActivationKey = (key: string): boolean => key === 'Enter' || key === ' '

const keepActivationKeysLocal = <T extends { onKeyDown?: (event: KeyboardEvent<HTMLElement>) => void }>(props: T) => ({
  ...props,
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
    props.onKeyDown?.(event)
    if (isActivationKey(event.key)) event.stopPropagation()
  },
})

export interface OverflowProps {
  display: Display
  writeCell: WriteCell
  writeCells: WriteMany
  writeCellRange: WriteCellRange
  openHelp: () => void
  insertLink: () => void
  canInsertLink: boolean
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

export function OverflowMenu({ display, writeCell, writeCells, writeCellRange, openHelp, insertLink, canInsertLink, sheet, previewSheetReplacement, applySheetReplacement, clearCellValues, confirm, showFormulas, toggleShowFormulas, showGridlines, toggleShowGridlines, clearAllFormats }: OverflowProps) {
  const fileRef = useRef<HTMLInputElement | null>(null)
  const jsonRef = useRef<HTMLInputElement | null>(null)
  const exportCsvFile = () => exportOverflowCsv({ display, sheet, downloadFile })
  const importCsvFile = (file: File) => importOverflowCsv({ file, confirm, sheet, writeCell, writeCells, writeCellRange })
  const exportJson = () => exportOverflowJson({ sheet, downloadFile })
  const importJson = (file: File) => importOverflowJson({ file, confirm, previewSheetReplacement, applySheetReplacement })

  const items = useMemo(() => {
    const cellValueCount = recordEntryCount(sheet.cells)
    const formatEntryCount = recordEntryCount(sheet.styles) + recordEntryCount(sheet.formats) + sheet.condFormat.length
    return overflowMenuItems({
      showFormulas,
      showGridlines,
      canInsertLink,
      canClearValues: cellValueCount > 0,
      cellValueCount,
      canClearFormats: formatEntryCount > 0,
      formatEntryCount,
    })
  }, [canInsertLink, sheet.cells, sheet.condFormat, sheet.formats, sheet.styles, showFormulas, showGridlines])
  const data = fromList(items.map(({ id, label, disabled, kind, checked }) => ({ id, label, disabled, kind, checked })))

  const onEvent = (e: UiEvent) => {
    if (e.type === 'activate' && e.id) {
      const id = overflowMenuItemId(e.id)
      if (!id) return
      if (items.find((item) => item.id === id)?.disabled) return
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
  const triggerLabel = open ? '더 보기 메뉴 닫기' : '더 보기 메뉴 열기'
  const localTriggerProps = keepActivationKeysLocal(triggerProps)

  return (
    <span className="overflow-menu">
      <button {...localTriggerProps} type="button" className="overflow-trigger" title={triggerLabel} aria-label={triggerLabel}>⋮</button>
      {open && (
        <div {...menuProps} className="overflow-list">
          {items.map((it) => {
            const patternProps = it.disabled
              ? { role: 'menuitem' as const, 'aria-disabled': true, tabIndex: -1 }
              : itemProps(it.id)
            const visibleLabel = it.label.replace(/^✓\s*/, '')
            const itemLabel = it.disabled
              ? it.disabledLabel ?? `${it.label} 사용할 수 없음`
              : it.kind === 'menuitemcheckbox'
                ? `${visibleLabel} ${it.checked ? '켜짐' : '꺼짐'}`
                : it.label
            const ariaLabel = it.disabled || it.kind === 'menuitemcheckbox' ? itemLabel : undefined
            const keyShortcuts = it.disabled ? undefined : it.keyShortcuts
            const visibleText = it.disabled && it.keyShortcuts ? it.label.replace(/\s+\([^)]*\)$/, '') : it.label
            return (
              <button
                key={it.id}
                {...keepActivationKeysLocal(patternProps)}
                type="button"
                className="overflow-item"
                disabled={it.disabled}
                title={itemLabel}
                aria-label={ariaLabel}
                aria-keyshortcuts={keyShortcuts}
              >{visibleText}</button>
            )
          })}
        </div>
      )}
      <input ref={fileRef} type="file" accept=".csv,text/csv" style={{ display: 'none' }} title="CSV 파일 가져오기" aria-label="CSV 파일 가져오기"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) importCsvFile(f); e.target.value = '' }} />
      <input ref={jsonRef} type="file" accept=".json,application/json" style={{ display: 'none' }} title="JSON 파일 가져오기" aria-label="JSON 파일 가져오기"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) importJson(f); e.target.value = '' }} />
    </span>
  )
}
