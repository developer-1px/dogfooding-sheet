import { useEffect, useMemo, useRef, useState } from 'react'
import { gridDefinition, reducePatternData, type Key, type PatternData, type PatternEvent, type PatternEventReason } from '@interactive-os/aria'
import { useGridPattern } from '@interactive-os/aria/react'
import { idsBetween } from '@spredsheet/grid'
import type { SelectedIdsUpdate } from '@spredsheet/selection-contract'
import type { SheetGridCell, SheetGridItemProps, SheetGridRow } from './gridTypes'

interface Args {
  data: PatternData
  rowCount: number
  colCount: number
  setFocusId: (id: string) => void
  setSelectedIds: (ids: SelectedIdsUpdate<string>) => void
  setSelectAnchor: (id: string | null) => void
  startEdit?: (id: string, prefill?: string, opts?: { caret?: 'end' | 'start' | 'select-all' }) => void
  isEditing?: () => boolean
}

const directionsByArrow: Record<string, Extract<PatternEvent, { type: 'navigate' }>['direction'] | undefined> = {
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowUp: 'up',
}

const gridKeyShortcuts = [
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'Shift+ArrowUp',
  'Shift+ArrowDown',
  'Shift+ArrowLeft',
  'Shift+ArrowRight',
  'Enter',
].join(' ')

const toItemProps = (props: SheetGridItemProps | undefined, id?: string): SheetGridItemProps => ({
  ...(props ?? {}),
  ...(id ? { 'data-id': id } : {}),
})

const toSheetGridItemProps = (props: SheetGridItemProps | undefined, id?: string): SheetGridItemProps => {
  const itemProps = toItemProps(props, id)
  return typeof itemProps['aria-colindex'] === 'number'
    ? { ...itemProps, 'aria-colindex': itemProps['aria-colindex'] + 1 }
    : itemProps
}

const toSheetCell = (cell: { key: Key; value: string; state: { selected: boolean } }): SheetGridCell => ({
  id: cell.key,
  label: cell.value,
  selected: cell.state.selected,
})

export function useSheetGrid({ data, rowCount, colCount, setFocusId, setSelectedIds, setSelectAnchor, startEdit, isEditing }: Args) {
  const dragAnchor = useRef<string | null>(null)
  const dragging = useRef(false)
  const suppressNextSelect = useRef(false)
  const [lastEventReason, setLastEventReason] = useState<PatternEventReason | undefined>(undefined)

  useEffect(() => {
    const stopDrag = () => { dragging.current = false }
    window.addEventListener('mouseup', stopDrag)
    return () => window.removeEventListener('mouseup', stopDrag)
  }, [])

  const dataWithLastReason = useMemo<PatternData>(() => ({
    ...data,
    state: {
      ...data.state,
      lastEventReason,
    },
  }), [data, lastEventReason])

  const moveFocus = (id: string) => {
    setFocusId(id)
    setSelectedIds([])
    setSelectAnchor(id)
  }

  const selectCell = (id: string) => {
    setFocusId(id)
    setSelectedIds([id])
    setSelectAnchor(id)
  }

  const selectRange = (anchor: string, id: string) => {
    setFocusId(id)
    setSelectedIds(idsBetween(anchor, id))
    setSelectAnchor(anchor)
  }

  const nextFocusFor = (event: Extract<PatternEvent, { type: 'navigate' }>) =>
    reducePatternData(gridDefinition, dataWithLastReason, event).state?.activeKey ?? null

  const onEvent = (event: PatternEvent) => {
    setLastEventReason(event.meta?.reason)

    if (event.type === 'navigate') {
      const next = nextFocusFor(event)
      if (next) moveFocus(next)
      return
    }

    if (event.type === 'focus') {
      setFocusId(event.key)
      return
    }

    if (event.type === 'select') {
      if (suppressNextSelect.current) {
        suppressNextSelect.current = false
        return
      }
      const focus = event.extentKey ?? event.anchorKey ?? event.keys[0]
      if (focus) setFocusId(focus)
      setSelectedIds([...event.keys])
      setSelectAnchor(event.anchorKey ?? focus ?? null)
      return
    }

    if (event.type === 'editStart') {
      if (isEditing?.()) return
      startEdit?.(event.key, undefined, { caret: 'end' })
    }
  }

  const grid = useGridPattern(dataWithLastReason, onEvent)
  const headerRow = grid.rows[0]
  const renderedRows = grid.rows.slice(1)
  const rowPropsById = new Map<string, SheetGridItemProps>(
    renderedRows.map((row) => [row.key, { ...row.rowProps, 'data-row-id': row.key }]),
  )
  const cells = [...(headerRow?.cells ?? []), ...renderedRows.flatMap((row) => row.cells)]
  const cellPropsById = new Map<string, SheetGridItemProps>(
    cells.map((cell) => [cell.key, toSheetGridItemProps(cell.cellProps as SheetGridItemProps, cell.key)]),
  )

  const rootProps: SheetGridItemProps = {
    ...(grid.gridProps as SheetGridItemProps),
    'aria-label': '스프레드시트 그리드',
    'aria-rowcount': rowCount + 1,
    'aria-colcount': colCount + 1,
    'aria-multiselectable': true,
    'aria-keyshortcuts': gridKeyShortcuts,
    onKeyDown: (event) => {
      if (event.defaultPrevented) return
      const active = dataWithLastReason.state?.activeKey
      const direction = directionsByArrow[event.key]
      if (event.shiftKey && direction && active) {
        event.preventDefault()
        const next = nextFocusFor({ type: 'navigate', direction, meta: { reason: 'keyboard' } })
        const anchor = dataWithLastReason.state?.anchorKey ?? active
        if (next) selectRange(anchor, next)
        return
      }
      grid.gridProps.onKeyDown?.(event)
    },
  }

  const rows: SheetGridRow[] = renderedRows.map((row) => ({
    id: row.key,
    cells: row.cells.map(toSheetCell),
  }))

  const getCellHandlers = (id: string) => ({
    onMouseDown: (event: React.MouseEvent) => {
      if (event.button !== 0) return
      const anchor = dataWithLastReason.state?.anchorKey ?? dataWithLastReason.state?.activeKey
      if (event.shiftKey && anchor) {
        event.preventDefault()
        suppressNextSelect.current = true
        selectRange(anchor, id)
        return
      }
      dragging.current = true
      dragAnchor.current = id
      selectCell(id)
    },
    onMouseEnter: () => {
      if (!dragging.current || !dragAnchor.current) return
      selectRange(dragAnchor.current, id)
    },
  })

  return {
    rootProps,
    rowProps: (id: string) => rowPropsById.get(id) ?? { role: 'row', 'data-row-id': id },
    columnHeaderProps: (id: string) => cellPropsById.get(id) ?? { role: 'columnheader', 'data-id': id },
    cellProps: (id: string) => cellPropsById.get(id) ?? { role: 'gridcell', tabIndex: -1, 'data-id': id },
    rows,
    getCellHandlers,
  }
}
