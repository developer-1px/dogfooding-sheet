import { act, createElement, useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { describe, expect, it } from 'vitest'
import { useEditableGridDomFocus, type EditableGridCaretMode } from './primitives'

interface HarnessApi {
  startEdit: (caret?: EditableGridCaretMode) => void
  finishEdit: () => void
}

function setup() {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  const host = document.createElement('div')
  document.body.append(host)
  const root = createRoot(host)
  let api: HarnessApi | null = null

  function Harness() {
    const [editing, setEditing] = useState<string | null>(null)
    const focus = useEditableGridDomFocus({ editingId: editing, activeId: 'cell-a' })
    api = {
      startEdit: (caret) => {
        focus.requestEditorCaret(caret)
        setEditing('cell-a')
      },
      finishEdit: () => {
        focus.requestCellFocusRestore('cell-a')
        setEditing(null)
      },
    }

    return (
      <span role="gridcell" tabIndex={-1} data-id="cell-a">
        {editing === 'cell-a' ? <input ref={focus.editorRef} defaultValue="Hello" /> : 'Hello'}
      </span>
    )
  }

  act(() => root.render(createElement(Harness)))
  return {
    host,
    root,
    api: () => {
      if (!api) throw new Error('Harness API was not initialized')
      return api
    },
  }
}

const cleanup = (root: Root, host: HTMLElement) => {
  act(() => root.unmount())
  host.remove()
}

describe('editable grid primitives', () => {
  it('focuses the editor with requested caret and restores gridcell focus', () => {
    const { host, root, api } = setup()
    try {
      act(() => api().startEdit('end'))
      const input = document.querySelector<HTMLInputElement>('input')
      expect(document.activeElement).toBe(input)
      expect(input?.selectionStart).toBe(5)
      expect(input?.selectionEnd).toBe(5)

      act(() => api().finishEdit())
      const cell = document.querySelector<HTMLElement>('[role="gridcell"][data-id="cell-a"]')
      expect(document.activeElement).toBe(cell)
    } finally {
      cleanup(root, host)
    }
  })
})
