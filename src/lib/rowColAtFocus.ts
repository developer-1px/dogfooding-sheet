interface Mut {
  insertRow: (r: number) => void
  deleteRow: (r: number) => void
  insertCol: (c: string) => void
  deleteCol: (c: string) => void
  hideRow: (r: number) => void
  hideCol: (c: string) => void
}

export function rowColAtFocus(focusKey: string | null, m: Mut) {
  const at = () => focusKey ? /^([A-J])(\d+)$/.exec(focusKey) : null
  return {
    insertRowAtFocus: () => { const p = at(); if (p) m.insertRow(Number(p[2]) - 1) },
    deleteRowAtFocus: () => { const p = at(); if (p) m.deleteRow(Number(p[2]) - 1) },
    insertColAtFocus: () => { const p = at(); if (p) m.insertCol(p[1]) },
    deleteColAtFocus: () => { const p = at(); if (p) m.deleteCol(p[1]) },
    hideRowAtFocus: () => { const p = at(); if (p) m.hideRow(Number(p[2]) - 1) },
    hideColAtFocus: () => { const p = at(); if (p) m.hideCol(p[1]) },
  }
}
