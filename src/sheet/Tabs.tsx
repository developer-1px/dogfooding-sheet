import { fromList, type UiEvent } from '@p/aria-kernel'
import { useTabsPattern } from '@p/aria-kernel/patterns'
import type { TabsState } from './useTabs'

interface Props {
  state: TabsState
  switchTab: (name: string) => void
  addSheet: () => void
  deleteSheet: (name: string) => void
  renameSheet: (oldName: string, newName: string) => void
}

export function Tabs({ state, switchTab, addSheet, deleteSheet, renameSheet }: Props) {
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
          onDoubleClick={() => {
            const next = window.prompt('시트 이름', name)
            if (next != null) renameSheet(name, next)
          }}
          title="더블클릭으로 이름 변경"
        >
          {name}
          {state.order.length > 1 && (
            <button
              className="tab-close"
              onClick={(e) => { e.stopPropagation(); if (confirm(`"${name}" 시트를 삭제하시겠습니까?`)) deleteSheet(name) }}
              title="시트 삭제"
            >×</button>
          )}
        </span>
      ))}
      <button className="tab-add" onClick={addSheet} title="시트 추가">+</button>
    </div>
  )
}
