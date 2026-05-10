import { fromList, type UiEvent } from '@p/aria-kernel'
import { useTabsPattern } from '@p/aria-kernel/patterns'
import { useEditable } from 'editable-lifecycle'
import type { ConfirmOptions } from './useConfirm'
import type { TabsState } from './useTabs'

interface Props {
  state: TabsState
  switchTab: (name: string) => void
  addSheet: () => void
  deleteSheet: (name: string) => void
  renameSheet: (oldName: string, newName: string) => void
  duplicateSheet: (name: string) => void
  confirm: (opts: ConfirmOptions) => Promise<boolean>
}

export function Tabs({ state, switchTab, addSheet, deleteSheet, renameSheet, duplicateSheet, confirm }: Props) {
  const ed = useEditable<string>({
    getValue: (id) => id,
    onCommit: (oldName, draft) => {
      if (draft && draft !== oldName) renameSheet(oldName, draft)
    },
  })

  const data = fromList(state.order.map((name) => ({ id: name, label: name })))
  data.meta = { ...data.meta, focus: state.active }
  for (const name of state.order) {
    data.entities[name] = { ...(data.entities[name] ?? {}), selected: name === state.active }
  }

  const onEvent = (e: UiEvent) => {
    if (e.type === 'navigate' && e.id) switchTab(e.id)
    else if (e.type === 'activate' && e.id) switchTab(e.id)
    else if (e.type === 'select' && e.ids[0]) switchTab(e.ids[0])
  }

  const { rootProps, tabProps } = useTabsPattern(data, onEvent, {
    label: '시트 탭',
    activationMode: 'automatic',
  })

  return (
    <div {...rootProps} className="tabs-bar">
      {state.order.map((name) => (
        <span
          key={name}
          {...tabProps(name)}
          className={`tab${name === state.active ? ' active' : ''}`}
          onDoubleClick={() => ed.startEdit(name, undefined, { caret: 'select-all' })}
          title="더블클릭으로 이름 변경"
        >
          {ed.editing === name ? (
            <input className="tab-rename" {...ed.inputProps} />
          ) : name}
          <button className="tab-dup" onClick={(e) => { e.stopPropagation(); duplicateSheet(name) }} title="시트 복제">⎘</button>
          {state.order.length > 1 && (
            <button
              className="tab-close"
              onClick={(e) => {
                e.stopPropagation()
                confirm({ message: `"${name}" 시트를 삭제하시겠습니까?`, confirmLabel: '삭제' })
                  .then((ok) => { if (ok) deleteSheet(name) })
              }}
              title="시트 삭제"
            >×</button>
          )}
        </span>
      ))}
      <button className="tab-add" onClick={addSheet} title="시트 추가">+</button>
    </div>
  )
}
