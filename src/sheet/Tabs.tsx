import type { TabsState } from './useTabs'

interface Props {
  state: TabsState
  switchTab: (name: string) => void
  addSheet: () => void
  deleteSheet: (name: string) => void
  renameSheet: (oldName: string, newName: string) => void
}

export function Tabs({ state, switchTab, addSheet, deleteSheet, renameSheet }: Props) {
  return (
    <div className="tabs-bar">
      {state.order.map((name) => (
        <span
          key={name}
          className={`tab${name === state.active ? ' active' : ''}`}
          onClick={() => switchTab(name)}
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
