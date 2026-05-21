import { forwardRef } from 'react'
import type { ComponentPropsWithoutRef } from 'react'
import type { EditableGridProfile } from './contract'

const cx = (...classes: readonly (string | false | null | undefined)[]): string =>
  classes.filter(Boolean).join(' ')

export interface EditableGridRootProps extends ComponentPropsWithoutRef<'div'> {
  readonly profile: EditableGridProfile
  readonly rowCount: number
  readonly colCount: number
}

export const EditableGridRoot = forwardRef<HTMLDivElement, EditableGridRootProps>(function EditableGridRoot({
  profile,
  rowCount,
  colCount,
  className,
  ...props
}, ref) {
  return (
    <div
      {...props}
      ref={ref}
      role="grid"
      aria-rowcount={rowCount}
      aria-colcount={colCount}
      data-editable-grid-profile={profile}
      className={cx('editable-grid', `editable-grid--${profile}`, className)}
    />
  )
})

export interface EditableGridRowProps extends ComponentPropsWithoutRef<'div'> {
  readonly header?: boolean
  readonly rowIndex?: number
}

export const EditableGridRow = forwardRef<HTMLDivElement, EditableGridRowProps>(function EditableGridRow({
  header = false,
  rowIndex,
  className,
  ...props
}, ref) {
  return (
    <div
      {...props}
      ref={ref}
      role="row"
      aria-rowindex={rowIndex}
      className={cx('editable-grid-row', header && 'editable-grid-header-row', className)}
    />
  )
})

export interface EditableGridColumnHeaderProps extends ComponentPropsWithoutRef<'div'> {
  readonly colIndex: number
}

export const EditableGridColumnHeader = forwardRef<HTMLDivElement, EditableGridColumnHeaderProps>(function EditableGridColumnHeader({
  colIndex,
  className,
  ...props
}, ref) {
  return (
    <div
      {...props}
      ref={ref}
      role="columnheader"
      aria-colindex={colIndex}
      className={cx('editable-grid-header-cell', className)}
    />
  )
})

export interface EditableGridCellProps extends ComponentPropsWithoutRef<'div'> {
  readonly cellId: string
  readonly colIndex: number
  readonly selected: boolean
  readonly editing?: boolean
  readonly focusable: boolean
}

export const EditableGridCell = forwardRef<HTMLDivElement, EditableGridCellProps>(function EditableGridCell({
  cellId,
  colIndex,
  selected,
  editing = false,
  focusable,
  className,
  ...props
}, ref) {
  return (
    <div
      {...props}
      ref={ref}
      role="gridcell"
      aria-colindex={colIndex}
      aria-selected={selected}
      tabIndex={focusable ? 0 : -1}
      data-editable-grid-cell-id={cellId}
      className={cx('editable-grid-cell', selected && 'selected', editing && 'editing', className)}
    />
  )
})

export const EditableGridInput = forwardRef<HTMLInputElement, ComponentPropsWithoutRef<'input'>>(function EditableGridInput({
  className,
  ...props
}, ref) {
  return <input {...props} ref={ref} className={cx('editable-grid-input', className)} />
})

export const EditableGridSelect = forwardRef<HTMLSelectElement, ComponentPropsWithoutRef<'select'>>(function EditableGridSelect({
  className,
  ...props
}, ref) {
  return <select {...props} ref={ref} className={cx('editable-grid-input', className)} />
})
