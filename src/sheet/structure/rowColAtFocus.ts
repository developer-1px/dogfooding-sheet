import { rowColActionAtFocus, type RowColFocusCommand } from '@spredsheet/grid'

interface Mut {
  insertRow: (r: number) => void
  deleteRow: (r: number) => void
  insertCol: (c: string) => void
  deleteCol: (c: string) => void
  hideRow: (r: number) => void
  hideCol: (c: string) => void
}

export function rowColAtFocus(focusKey: string | null, m: Mut) {
  const run = (command: RowColFocusCommand) => {
    const action = rowColActionAtFocus(focusKey, command)
    if (action.type === 'none') return
    if (action.type === 'insertRow') m.insertRow(action.row)
    else if (action.type === 'deleteRow') m.deleteRow(action.row)
    else if (action.type === 'insertCol') m.insertCol(action.col)
    else if (action.type === 'deleteCol') m.deleteCol(action.col)
    else if (action.type === 'hideRow') m.hideRow(action.row)
    else m.hideCol(action.col)
  }
  return {
    insertRowAtFocus: () => run('insertRow'),
    deleteRowAtFocus: () => run('deleteRow'),
    insertColAtFocus: () => run('insertCol'),
    deleteColAtFocus: () => run('deleteCol'),
    hideRowAtFocus: () => run('hideRow'),
    hideColAtFocus: () => run('hideCol'),
  }
}
