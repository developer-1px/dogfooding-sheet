import { parseA1 } from './a1'

interface Mut {
  insertRow: (r: number) => void
  deleteRow: (r: number) => void
  insertCol: (c: string) => void
  deleteCol: (c: string) => void
  hideRow: (r: number) => void
  hideCol: (c: string) => void
}

export function rowColAtFocus(focusKey: string | null, m: Mut) {
  const at = () => focusKey ? parseA1(focusKey) : null
  return {
    insertRowAtFocus: () => { const p = at(); if (p) m.insertRow(p.row) },
    deleteRowAtFocus: () => { const p = at(); if (p) m.deleteRow(p.row) },
    insertColAtFocus: () => { const p = at(); if (p) m.insertCol(p.col) },
    deleteColAtFocus: () => { const p = at(); if (p) m.deleteCol(p.col) },
    hideRowAtFocus: () => { const p = at(); if (p) m.hideRow(p.row) },
    hideColAtFocus: () => { const p = at(); if (p) m.hideCol(p.col) },
  }
}
