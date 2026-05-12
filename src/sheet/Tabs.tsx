import { fromList, type UiEvent } from '@p/aria-kernel'
import { useTabsPattern } from '@p/aria-kernel/patterns'
import { useEditable } from '@p/anyeditable'
import type { Confirm } from './useConfirm'
import type { TabsState } from './useTabs'

interface Props {
  state: TabsState
  switchTab: (name: string) => void
  addSheet: () => void
  deleteSheet: (name: string) => void
  renameSheet: (oldName: string, newName: string) => void
  duplicateSheet: (name: string) => void
  setTabColor: (name: string, color: string) => void
  reorderTab: (from: string, to: string) => void
  confirm: Confirm
}

export function Tabs({ state, switchTab, addSheet, deleteSheet, renameSheet, duplicateSheet, setTabColor, reorderTab, confirm }: Props) {
  const ed = useEditable<string>({
    getValue: (id) => id,
    onCommit: (oldName, draft) => {
      if (draft && draft !== oldName) renameSheet(oldName, draft)
    },
  })

  const data = fromList(state.order.map((name) => ({ id: name, label: name })))

  const onEvent = (e: UiEvent) => {
    if (e.type === 'navigate' && e.id) switchTab(e.id)
    else if (e.type === 'activate' && e.id) switchTab(e.id)
    else if (e.type === 'select' && e.ids[0]) switchTab(e.ids[0])
  }

  const { rootProps, tabProps } = useTabsPattern(data, onEvent, {
    label: '시트 탭',
    activationMode: 'automatic',
    active: state.active,
  })

  return (
    <div {...rootProps} className="tabs-bar">
      {state.order.map((name) => (
        <span
          key={name}
          {...tabProps(name)}
          className={`tab${name === state.active ? ' active' : ''}`}
          draggable
          onDragStart={(e) => e.dataTransfer.setData('text/x-tab', name)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); const from = e.dataTransfer.getData('text/x-tab'); if (from && from !== name) reorderTab(from, name) }}
          onDoubleClick={() => ed.startEdit(name, undefined, { caret: 'select-all' })}
          style={state.colors[name] ? { borderBottom: `3px solid ${state.colors[name]}` } : undefined}
          title="더블클릭=이름 변경 / 드래그=순서 변경"
        >
          {ed.editing === name ? (
            <input className="tab-rename" {...ed.inputProps} />
          ) : name}
          <input type="color" className="tab-color" value={state.colors[name] ?? '#cccccc'} onChange={(e) => setTabColor(name, e.target.value)} onClick={(e) => e.stopPropagation()} title="탭 색상" />
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
