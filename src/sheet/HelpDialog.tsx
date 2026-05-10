import { useDialogPattern } from '@p/aria-kernel/patterns'

interface Props {
  open: boolean
  onClose: () => void
}

const SHORTCUTS: Array<[string, string]> = [
  ['Ctrl/⌘ + Z', '실행 취소'],
  ['Ctrl/⌘ + Shift + Z / Y', '다시 실행'],
  ['Ctrl/⌘ + C / X / V', '복사 / 잘라내기 / 붙여넣기'],
  ['Ctrl/⌘ + B / I / U', '굵게 / 기울임 / 밑줄'],
  ['Ctrl/⌘ + \\\\', '서식 모두 해제'],
  ['Ctrl/⌘ + S', 'CSV 내보내기'],
  ['Ctrl/⌘ + D / R', '아래로 / 오른쪽으로 채우기'],
  ['Ctrl/⌘ + ;', '오늘 날짜 입력'],
  ['Ctrl/⌘ + Shift + ;', '현재 시각 입력'],
  ['Ctrl/⌘ + F', '찾기'],
  ['Ctrl/⌘ + G', '셀로 이동 (예: B5)'],
  ['Ctrl/⌘ + H', '찾기 및 바꾸기'],
  ['Enter / Shift+Enter', '편집 후 아래/위 셀 이동'],
  ['Ctrl/⌘ + Enter', '커밋 후 같은 셀 유지'],
  ['Tab / Shift+Tab', '편집 후 오른쪽/왼쪽 셀 이동'],
  ['Ctrl/⌘ + 화살표', '데이터 영역 가장자리로 이동'],
  ['Ctrl/⌘ + Shift + 화살표', '가장자리까지 선택 확장'],
  ['Ctrl + Space / Shift + Space', '열 / 행 전체 선택'],
  ['Home / End', '현재 행의 처음 / 끝 셀로'],
  ['Ctrl/⌘ + Home / End', '시트의 처음 (A1) / 끝 셀로'],
  ['PageUp / PageDown', '10행 위 / 아래로 (Shift = 선택 확장)'],
  ['Delete / Backspace', '선택 셀 비우기'],
  ['F2', '셀 편집 시작'],
  ['F1 / ? / Ctrl+/', '이 도움말 열기'],
  ['Esc', '편집 취소 / 대화상자 닫기'],
]

export function HelpDialog({ open, onClose }: Props) {
  const { rootProps } = useDialogPattern({
    open, modal: true, label: '키보드 단축키',
  })
  if (!open) return null
  return (
    <>
      <div className="dialog-backdrop" onClick={onClose} />
      <div {...rootProps} className="help-dialog" onKeyDown={(e) => { if (e.key === 'Escape') onClose() }}>
        <h2 id="help-title">키보드 단축키</h2>
        <table>
          <tbody>
            {SHORTCUTS.map(([k, d]) => (
              <tr key={k}><td><kbd>{k}</kbd></td><td>{d}</td></tr>
            ))}
          </tbody>
        </table>
        <button onClick={onClose}>닫기</button>
      </div>
    </>
  )
}
