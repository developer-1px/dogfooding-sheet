import { fromList, type UiEvent } from '@interactive-os/aria-kernel'
import { useTabsPattern } from '@interactive-os/aria-kernel/patterns'
import { useReorderDndGestureRaw } from '@interactive-os/aria-kernel/gesture'
import { useEditable } from '../../interactive-os/useEditable'
import type { KeyboardEventHandler } from 'react'
import type { Confirm } from '../useConfirm'
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
  const stopTabUtilityKeyDown: KeyboardEventHandler<HTMLElement> = (e) => e.stopPropagation()
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
  const reorder = useReorderDndGestureRaw({
    onDrop: (from, to) => { if (from !== to) reorderTab(from, to) },
    mime: 'text/x-tab',
  })

  return (
    <div {...rootProps} className="tabs-bar">
      {state.order.map((name) => (
        <span
          key={name}
          {...tabProps(name)}
          {...reorder.getItemHandlers(name)}
          className={`tab${name === state.active ? ' active' : ''}${reorder.overId === name ? ` reorder-over-${reorder.overPosition}` : ''}`}
          onDoubleClick={() => ed.startEdit(name, undefined, { caret: 'select-all' })}
          style={state.colors[name] ? { borderBottom: `3px solid ${state.colors[name]}` } : undefined}
          title="더블클릭=이름 변경 / 드래그=순서 변경"
        >
          {ed.editing === name ? (
            <input className="tab-rename" {...ed.inputProps} title={`${name} 시트 이름 편집 (Enter=저장 / Esc=취소)`} aria-label={`${name} 시트 이름 편집`} aria-keyshortcuts="Enter Escape" />
          ) : name}
          <input
            type="color"
            className="tab-color"
            value={state.colors[name] ?? '#cccccc'}
            onChange={(e) => setTabColor(name, e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={stopTabUtilityKeyDown}
            title={`${name} 탭 색상 변경`}
            aria-label={`${name} 탭 색상 변경`}
          />
          <button
            type="button"
            className="tab-dup"
            onClick={(e) => { e.stopPropagation(); duplicateSheet(name) }}
            onKeyDown={stopTabUtilityKeyDown}
            title={`${name} 시트 복제`}
            aria-label={`${name} 시트 복제`}
          >⎘</button>
          {state.order.length > 1 && (
            <button
              type="button"
              className="tab-close"
              onClick={(e) => {
                e.stopPropagation()
                confirm({ message: `"${name}" 시트를 삭제하시겠습니까?`, confirmLabel: '삭제' })
                  .then((ok) => { if (ok) deleteSheet(name) })
                  .catch(() => {})
              }}
              onKeyDown={stopTabUtilityKeyDown}
              title={`${name} 시트 삭제`}
              aria-label={`${name} 시트 삭제`}
            >×</button>
          )}
        </span>
      ))}
      <button type="button" className="tab-add" onClick={addSheet} onKeyDown={stopTabUtilityKeyDown} title="시트 추가" aria-label="시트 추가">+</button>
    </div>
  )
}
