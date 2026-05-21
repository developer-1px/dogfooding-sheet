import { act, createElement, useState } from 'react'
import { describe, expect, it } from 'vitest'
import { setupReactDOM } from './test-utils'
import { useSheetSelection } from './useSheetSelection'

const dom = setupReactDOM()

describe('useSheetSelection', () => {
  it('adapts SelectionState and SelectionBoundary to sheet ids and keys', async () => {
    let api: (ReturnType<typeof useSheetSelection> & {
      focusId: string | null
      setRawFocusId: (id: string | null) => void
    }) | null = null

    function Harness() {
      const [focusId, setRawFocusId] = useState<string | null>('r0-A')
      const selection = useSheetSelection({ focusId, setFocusId: setRawFocusId })
      api = { ...selection, focusId, setRawFocusId }
      return null
    }

    await act(async () => dom.root.render(createElement(Harness)))
    const current = () => {
      if (!api) throw new Error('selection harness did not render')
      return api
    }

    expect(current().selectedIds).toEqual([])
    expect(current().selectAnchor).toBe('r0-A')
    expect(current().targetIds()).toEqual(['r0-A'])
    expect(current().targetKeys()).toEqual(['A1'])

    act(() => current().setSelectedIds(['r0-A', 'r1-B']))
    expect(current().selectedIds).toEqual(['r0-A', 'r1-B'])
    expect(current().targetKeys()).toEqual(['A1', 'B2'])

    act(() => current().setSelectedIds([]))
    act(() => current().setFocusId('r2-C'))
    expect(current().focusId).toBe('r2-C')
    expect(current().targetIds()).toEqual(['r2-C'])

    act(() => current().setRawFocusId('r3-D'))
    expect(current().targetKeys()).toEqual(['D4'])
  })
})
