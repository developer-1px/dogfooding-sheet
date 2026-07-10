import type { HTMLAttributes } from 'react'

export type SheetGridItemProps = HTMLAttributes<HTMLElement> & {
  id?: string
  role?: string
  tabIndex?: number
  'aria-colindex'?: number
  'aria-rowindex'?: number
  'aria-selected'?: boolean | 'true' | 'false'
  'data-id'?: string
  'data-row-id'?: string
}

export interface SheetGridCell {
  id: string
  label: string
  selected: boolean
}

export interface SheetGridRow {
  id: string
  cells: SheetGridCell[]
}
