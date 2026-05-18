import { parseA1 } from '../coordinates/a1'

export type RowColFocusAction =
  | { type: 'none' }
  | { type: 'insertRow'; row: number }
  | { type: 'deleteRow'; row: number }
  | { type: 'insertCol'; col: string }
  | { type: 'deleteCol'; col: string }
  | { type: 'hideRow'; row: number }
  | { type: 'hideCol'; col: string }

export type RowColFocusCommand = Exclude<RowColFocusAction['type'], 'none'>

export function rowColActionAtFocus(focusKey: string | null, command: RowColFocusCommand): RowColFocusAction {
  const p = focusKey ? parseA1(focusKey) : null
  if (!p) return { type: 'none' }
  switch (command) {
    case 'insertRow': return { type: 'insertRow', row: p.row }
    case 'deleteRow': return { type: 'deleteRow', row: p.row }
    case 'insertCol': return { type: 'insertCol', col: p.col }
    case 'deleteCol': return { type: 'deleteCol', col: p.col }
    case 'hideRow': return { type: 'hideRow', row: p.row }
    case 'hideCol': return { type: 'hideCol', col: p.col }
  }
}

