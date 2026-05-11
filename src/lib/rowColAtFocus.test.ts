import { describe, it, expect, vi } from 'vitest'
import { rowColAtFocus } from './rowColAtFocus'

const makeMut = () => ({
  insertRow: vi.fn(), deleteRow: vi.fn(),
  insertCol: vi.fn(), deleteCol: vi.fn(),
  hideRow: vi.fn(), hideCol: vi.fn(),
})

describe('rowColAtFocus', () => {
  it('parses focusKey "B5" → row=4, col=B', () => {
    const m = makeMut()
    const fns = rowColAtFocus('B5', m)
    fns.insertRowAtFocus(); expect(m.insertRow).toHaveBeenCalledWith(4)
    fns.insertColAtFocus(); expect(m.insertCol).toHaveBeenCalledWith('B')
    fns.hideRowAtFocus(); expect(m.hideRow).toHaveBeenCalledWith(4)
    fns.hideColAtFocus(); expect(m.hideCol).toHaveBeenCalledWith('B')
  })

  it('null focusKey → no-op', () => {
    const m = makeMut()
    const fns = rowColAtFocus(null, m)
    fns.insertRowAtFocus(); fns.deleteRowAtFocus(); fns.insertColAtFocus(); fns.deleteColAtFocus()
    expect(m.insertRow).not.toHaveBeenCalled()
    expect(m.insertCol).not.toHaveBeenCalled()
  })

  it('invalid focusKey → no-op', () => {
    const m = makeMut()
    const fns = rowColAtFocus('garbage', m)
    fns.insertRowAtFocus()
    expect(m.insertRow).not.toHaveBeenCalled()
  })
})
